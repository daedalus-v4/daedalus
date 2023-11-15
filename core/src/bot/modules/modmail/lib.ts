import {
    APIEmbed,
    Attachment,
    AttachmentPayload,
    BaseMessageOptions,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType,
    Guild,
    GuildMember,
    GuildTextBasedChannel,
    InteractionReplyOptions,
    Message,
    ModalSubmitInteraction,
    TextBasedChannel,
    TextInputStyle,
    ThreadAutoArchiveDuration,
    ThreadChannel,
    escapeMarkdown,
} from "discord.js";
import { WithId } from "mongodb";
import { DbModmailSettings, DbModmailThread } from "shared";
import { autoIncrement, db, getColor, getLimitFor, getPremiumBenefitsFor } from "shared/db.js";
import { formatCustomMessageString } from "shared/format-custom-message.js";
import { dataEncodeAttachments } from "../../../lib/attachments.js";
import { colors, embed, expand, mdash, template } from "../../lib/format.js";
import { invokeLog } from "../../lib/logging.js";
import { skip } from "../utils.js";

export const replies = {
    canceled: {
        embeds: [{ title: "Canceled", description: "Modmail message canceled.", color: colors.prompts.canceled }],
        components: [],
    },
    timedOut: {
        embeds: [
            {
                title: "Timed Out",
                description: "You did not respond in time. Please send your message again to try again.",
                color: colors.prompts.canceled,
            },
        ],
        components: [],
    },
};

export async function maybeLogInternalMessage(message: Message) {
    await db.modmailThreads.updateOne(
        { thread: message.channel.id },
        {
            $push: {
                messages: {
                    type: "internal",
                    author: message.author.id,
                    content: message.content,
                    attachments: await dataEncodeAttachments(message),
                    time: Date.now(),
                },
            },
        },
    );
}

export async function confirmRepeatGuild(message: Message, guild: Guild): Promise<[Message, boolean?]> {
    const reply = await message.reply({
        embeds: [
            {
                title: "**Server Selection**",
                description: `Last time you sent a modmail message, you sent it to **${escapeMarkdown(
                    guild.name,
                )}**. Would you like to send it there again? You have 2 minutes to decide.`,
                color: await getColor(guild),
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, style: ButtonStyle.Success, customId: "yes", label: "Yes" },
                    { type: ComponentType.Button, style: ButtonStyle.Primary, customId: "switch", label: "Switch Server" },
                    { type: ComponentType.Button, style: ButtonStyle.Danger, customId: "cancel", label: "Cancel" },
                ],
            },
        ],
    });

    try {
        const response = await reply.awaitMessageComponent({ time: 120000 });

        if (response.customId === "yes" || response.customId === "switch") {
            await response.update({
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "...", disabled: true }],
                    },
                ],
            });

            if (response.customId === "switch") return [reply];
        } else {
            await response.update(replies.canceled);
            return [reply, true];
        }
    } catch {
        await reply.edit(replies.timedOut);
        return [reply, true];
    }

    return [reply];
}

export async function selectGuild(message: Message, reply: Message): Promise<[Guild | undefined, boolean?]> {
    const openContacts = new Set((await db.modmailThreads.find({ user: message.author.id, closed: false }).toArray()).map((entry) => entry.guild));

    const unfiltered = await Promise.all(
        (await db.modulesPermissionsSettings.find({ "modules.modmail.enabled": true }).toArray()).map(
            async (x) => await message.client.guilds.fetch(x.guild).catch(() => {}),
        ),
    );

    const filtered: Guild[] = [];

    for (const guild of unfiltered) {
        if (!guild) continue;

        try {
            await guild.members.fetch({ user: message.author.id, force: true });
            filtered.push(guild);
        } catch {}
    }

    const guilds: Guild[] = [];

    for (const guild of filtered) if (!(await skip(guild, "modmail"))) guilds.push(guild);

    if (guilds.length === 0) {
        await reply.edit(template.error("You are not in any servers where modmail is enabled."));
        return [undefined, true];
    } else if (guilds.length === 1) {
        const [guild] = guilds;

        await reply.edit({
            embeds: [
                {
                    title: "**Server Selection**",
                    description: `Please confirm that you would like to send your message as modmail to **${escapeMarkdown(guild.name)}** (\`${
                        guild.id
                    }\`). You have 2 minutes to decide.`,
                    color: await getColor(guild),
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: ButtonStyle.Success, customId: "confirm", label: "Confirm" },
                        { type: ComponentType.Button, style: ButtonStyle.Danger, customId: "cancel", label: "Cancel" },
                    ],
                },
            ],
        });

        try {
            const response = await reply.awaitMessageComponent({ time: 120000 });

            if (response.customId === "cancel") {
                await response.update(replies.canceled);
                return [undefined, true];
            }

            await response.update({
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "...", disabled: true }],
                    },
                ],
            });

            return [guild];
        } catch {
            await reply.edit(replies.timedOut);
            return [undefined, true];
        }
    } else {
        let first = true;
        const extras: Message[] = [];

        while (guilds.length > 0) {
            const block = guilds.splice(0, 25);

            const data: BaseMessageOptions = {
                embeds: [
                    {
                        title: first ? "**Server Selection**" : "",
                        description: first ? "You have 2 minutes to decide." : "",
                        color: colors.default,
                        fields: block.map((guild, index) => ({
                            name: `**__${index + 1}.__ ${escapeMarkdown(guild.name)}**`,
                            value: `${openContacts.has(guild.id) ? "Continue Open Ticket" : "Create New Ticket"}\nID: \`${guild.id}\``,
                            inline: true,
                        })),
                    },
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.StringSelect,
                                customId: "guild-selector",
                                placeholder: "Select the server to contact.",
                                options: block.map((guild, index) => ({ label: `${index + 1}. ${guild.name}`.slice(0, 100), value: guild.id })),
                            },
                        ],
                    },
                ],
            };

            if (first) {
                await reply.edit(data);
                first = false;
            } else {
                extras.push(await message.channel.send(data));
            }
        }

        try {
            const response = await Promise.race(
                [reply, ...extras].map((m) => m.awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 120000 })),
            );

            if (response.customId === "cancel") {
                await response.update(replies.canceled);
                return [undefined, true];
            }

            await response.update({
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "...", disabled: true }],
                    },
                ],
            });

            const guild = message.client.guilds.cache.get(response.values[0]);

            if (!guild || !guild.members.cache.has(message.author.id)) {
                await reply.edit(template.error("The server you selected no longer exists, the bot was kicked, or you are no longer in this server."));
                return [undefined, true];
            }

            return [guild];
        } catch {
            await reply.edit(replies.timedOut);
            return [undefined, true];
        } finally {
            extras.forEach((m) => m.delete());
        }
    }
}

export async function resolveVanity(message: Message, guild: Guild, files: AttachmentPayload[]) {
    const reply = await message.reply({
        embeds: [
            {
                title: "**Modmail Confirmation**",
                description: `Please confirm that you would like to send this message through modmail to **${escapeMarkdown(
                    guild.name,
                )}**. You have 2 minutes to decide.`,
                color: await getColor(guild),
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Success,
                        customId: "send",
                        label: "Send",
                        emoji: "📨",
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: "cancel",
                        label: "Cancel",
                    },
                ],
            },
        ],
    });

    try {
        const response = await reply.awaitMessageComponent({ time: 120000 });

        if (response.customId === "cancel") return void (await response.update(replies.canceled));

        await response.update({
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "...", disabled: true }],
                },
            ],
        });
    } catch {
        return void (await reply.edit(replies.timedOut));
    }

    await resolve(message, guild, reply, files);
}

export async function resolve(message: Message, guild: Guild, reply: Message, files: AttachmentPayload[]) {
    const settings = await db.modmailSettings.findOne({ guild: guild.id });

    const targets = settings?.targets
        .slice(0, (await getPremiumBenefitsFor(guild.id)).multiModmail ? await getLimitFor(guild, "modmailTargetCount") : 1)
        .filter((x) => !!x.logChannel && (x.useThreads || !!x.category));

    const color = await getColor(guild);

    if (!targets?.length)
        return void (await reply.edit(template.error("This server enabled modmail but has not configured it or its configuration is invalid.")));

    let target: DbModmailSettings["targets"][0];

    if (targets.length === 1) [target] = targets;
    else {
        await reply.edit({
            embeds: [
                {
                    title: "**Select Modmail Target**",
                    description: "Please select the target to which to send your modmail message. You have 2 minutes to decide.",
                    color,
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.StringSelect,
                            customId: "target-selection",
                            options: targets.map((x) => ({
                                label: x.name,
                                description: x.description || undefined,
                                emoji: x.emoji ?? undefined,
                                value: `${x.id}`,
                            })),
                        },
                    ],
                },
            ],
        });

        try {
            const response = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 120000 });

            target = targets.find((x) => `${x.id}` === response.values[0])!;

            if (!target)
                return void (await reply.edit(
                    template.error(
                        "An unexpected error occurred (selected target is invalid). This appears to be our fault; please contact Daedalus support (**not** the server's staff) if this issue persists.",
                    ),
                ));
        } catch {
            return void (await reply.edit(replies.timedOut));
        }
    }

    const entry = await db.modmailThreads.findOne({ guild: guild.id, user: message.author.id, id: target.id });
    let channel: TextBasedChannel | ThreadChannel | undefined;
    let creating = false;
    let informedOfError = false;
    let error: any;

    if (entry) {
        const fetched = await guild.channels.fetch(entry.channel).catch(() => {});

        if (target.useThreads) {
            if (fetched?.isThread()) channel = fetched;
        } else {
            if (fetched?.isTextBased() && !fetched.isThread()) channel = fetched;
        }
    }

    if (!channel) {
        creating = true;

        if (target.useThreads) {
            const root = await guild.channels.fetch(target.logChannel!).catch((e) => void (error = e));

            if (!root || !("threads" in root)) {
                await reply.edit(template.error("Invalid channel: root channel does not exist or cannot contain threads."));
                informedOfError = true;
            } else
                channel = await root.threads
                    .create({
                        name: message.author.tag,
                        message: embed("New Modmail Thread", `This modmail thread is with ${message.author}.`, color),
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    })
                    .catch((e) => void (error = e));
        } else {
            const root = await guild.channels.fetch(target.category!).catch(() => {});

            if (root?.type !== ChannelType.GuildCategory) {
                await reply.edit(template.error("Invalid channel: root channel does not exist or is not a category."));
                informedOfError = true;
            } else
                channel =
                    root.children.cache.size >= 50
                        ? await root.guild.channels
                              .create({ name: message.author.tag, permissionOverwrites: root.permissionOverwrites.cache })
                              .catch((e) => void (error = e))
                        : await root.children.create({ name: message.author.tag }).catch((e) => void (error = e));
        }
    }

    if (!channel) {
        if (!informedOfError)
            await reply.edit(
                template.error(
                    "Your modmail thread could not be created. Please ask server staff to check the modmail configuration and the bot's permissions in the server.",
                ),
            );

        invokeLog("botError", guild, () => template.logerror(`Bot Error ${mdash} Modmail`, `Error creating modmail thread:\n\`\`\`\n${error}\n\`\`\``));
        return;
    }

    if (creating && !target.useThreads) {
        try {
            const log = await guild.channels.fetch(target.logChannel!);

            if (!log) throw `Log channel (${target.logChannel}) does not exist or cannot be seen by the bot.`;
            if (!log?.isTextBased()) throw `Log channel (${target.logChannel}) is of the wrong channel type.`;

            await log.send(embed("New Modmail Thread", `A modmail thread was just opened with ${message.author}: ${channel}.`, colors.statuses.success));
        } catch (error) {
            invokeLog("botError", guild, () => template.logerror(`Bot Error ${mdash} Modmail`, `Error posting log message:\n\`\`\`\n${error}\n\`\`\``));
        }
    }

    let uuid: string;

    do {
        uuid = crypto.randomUUID();
    } while ((await db.modmailThreads.countDocuments({ uuid })) > 0);

    await db.modmailThreads.updateOne(
        { guild: guild.id, user: message.author.id, id: target.id },
        {
            $setOnInsert: { uuid },
            $push: { messages: { type: "open", author: message.author.id, time: Date.now(), targetName: target.id === -1 ? null : target.name } },
        },
        { upsert: true },
    );

    const isNewThread = entry?.closed ?? true;

    if (isNewThread)
        await channel
            .send({
                content: `${target.pingHere ? "@here " : ""}${target.pingRoles.map((x) => `<@&${x}>`).join(" ")}`,
                embeds: [
                    {
                        title: "Modmail Thread Opened",
                        description: `This modmail thread was just opened by ${message.author}.`,
                        color,
                    },
                ],
                allowedMentions: { parse: ["everyone", "roles"] },
            })
            .catch((error) =>
                invokeLog("botError", guild, () => template.logerror(`Bot Error ${mdash} Modmail`, `Error posting modmail ping:\n\`\`\`\n${error}\n\`\`\``)),
            );

    const pings = (await db.modmailNotifications.find({ channel: channel.id }).toArray()).map((entry) => entry.user);
    await db.modmailNotifications.deleteMany({ channel: channel.id, once: true });

    const contents = pings.length > 0 ? [`<@${pings.shift()}>`] : [];

    for (const ping of pings) {
        if (contents.at(-1)!.length + ping.length + 4 <= 2000) contents[contents.length - 1] = `${contents.at(-1)} <@${ping}>`;
        else contents.push(`<@${ping}>`);
    }

    for (const content of contents.slice(0, -1)) await channel.send({ content, allowedMentions: { parse: ["users"] } }).catch(() => {});

    let sent: Message;

    try {
        sent = await channel.send({
            content: contents.at(-1),
            embeds: [
                {
                    title: "Incoming Message",
                    description: message.content,
                    author: { name: message.author.tag, icon_url: message.author.displayAvatarURL({ size: 256 }) },
                    timestamp: new Date().toISOString(),
                    color,
                    footer: { text: message.url },
                },
            ],
            files,
            allowedMentions: { parse: ["users"] },
        });
    } catch (error) {
        await reply.edit(template.error("Sending your message failed. Please contact support if this issue persists."));
        invokeLog("botError", guild, () => template.logerror(`Bot Error ${mdash} Modmail`, `Error posting user's message:\n\`\`\`\n${error}\n\`\`\``));
        return;
    }

    await db.tasks.deleteOne({ action: "modmail/close", channel: channel.id });

    await db.modmailThreads.updateOne(
        { guild: guild.id, user: message.author.id, id: target.id },
        {
            $set: { channel: channel.id, closed: false },
            $push: {
                messages: {
                    type: "incoming",
                    content: message.content,
                    attachments: await dataEncodeAttachments(sent),
                    time: Date.now(),
                },
            },
        },
    );

    let description: string | undefined;

    if (isNewThread) {
        description =
            (await formatCustomMessageString(target.openMessageParsed, { guild, user: message.author }).catch(() => {})) ||
            `Thank you for contacting ${escapeMarkdown(guild.name)}'s staff! They will get back to you shortly.`;
    }

    await reply.edit({
        embeds: [{ title: `Message sent to **${escapeMarkdown(guild.name)}**`, description, footer: { text: `ID: ${guild.id}` }, color }],
        components: [],
    });

    await message.react("✅");
}

export function getModmailContactInfo<P extends boolean>(permitAbsent: P) {
    return async function <T extends { _: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction | GuildTextBasedChannel }>(
        data: T,
    ): Promise<T & { member: P extends true ? GuildMember | undefined : GuildMember; thread: WithId<DbModmailThread> }> {
        const { _ } = data;
        const channel = "channel" in _ ? _.channel! : _;

        const thread = await db.modmailThreads.findOne({ channel: channel.id });
        if (!thread) throw "This is not a modmail thread.";
        if (thread.closed) throw "This thread is closed.";

        const member = await _.guild!.members.fetch(thread.user).catch(() => {});
        if (!member && !permitAbsent) throw "The recipient does not appear to be in this server anymore.";

        return { ...data, member: member as any, thread };
    };
}

export async function handleReply(
    _: ChatInputCommandInteraction | ModalSubmitInteraction,
    caller: GuildMember,
    member: GuildMember,
    anon: boolean,
    content: string | undefined,
    filemap: Record<string, Attachment | null>,
): Promise<InteractionReplyOptions> {
    const files = Object.values(filemap)
        .filter((x) => x)
        .map((x) => ({ name: x!.name, attachment: x!.url }));

    if (!content && files.length === 0) throw "You must either include content or at least one file.";

    const data: APIEmbed = {
        description: content ?? undefined,
        author: { name: anon ? "Anonymous Message" : _.user.tag, icon_url: anon ? undefined : caller.displayAvatarURL({ size: 256 }) },
        timestamp: new Date().toISOString(),
        color: await getColor(_.guild!),
        footer: anon ? undefined : { text: caller.roles.highest?.name },
    };

    let output: Message;

    try {
        output = await member.send({ embeds: [{ title: `Incoming Staff Message from ${_.guild!.name}`, ...data }], files });
    } catch {
        throw "The user could not be messaged. They may have DMs off or have blocked the bot.";
    }

    await db.tasks.deleteOne({ action: "modmail/close", channel: _.channel!.id });

    const id = await autoIncrement(`modmail/${_.channel!.id}`);

    await db.modmailThreads.updateOne(
        { channel: _.channel!.id },
        {
            $push: {
                messages: {
                    type: "outgoing",
                    id,
                    message: output.id,
                    author: _.user.id,
                    anon: !!anon,
                    content: content || "",
                    attachments: await dataEncodeAttachments(output),
                    time: Date.now(),
                    deleted: false,
                },
            },
        },
    );

    return {
        embeds: [{ title: "Outgoing Message", ...data }],
        files,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        customId: `:${_.user.id}:modmail/edit:${id}`,
                        emoji: "✏️",
                        label: "Edit",
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: `:${_.user.id}:modmail/delete:${id}`,
                        emoji: "🗑️",
                        label: "Delete",
                    },
                ],
            },
        ],
    };
}

export async function startModal(
    _: ChatInputCommandInteraction,
    caller: GuildMember,
    member: GuildMember,
    anon: boolean,
    content: string | undefined,
    filemap: Record<string, Attachment | null>,
) {
    await _.showModal({
        title: "Modmail Response",
        customId: "-",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "content",
                        label: "Content",
                        value: content,
                        maxLength: 2000,
                        required: true,
                        placeholder: "You have 30 minutes to submit your response.",
                    },
                ],
            },
        ],
    });

    const modal = await _.awaitModalSubmit({ time: 1800000 }).catch(() => {});
    if (!modal) return;

    content = modal.fields.getTextInputValue("content");
    await modal.deferReply({ ephemeral: false });

    try {
        await modal.editReply(await handleReply(_, caller, member, anon, content, filemap));
    } catch (error) {
        await modal.editReply(template.error(`${error}`));
    }
}

export async function close(ctx: ChatInputCommandInteraction | GuildTextBasedChannel, user: string, notify: boolean, content: string) {
    const send = ctx instanceof ChatInputCommandInteraction ? ctx.editReply.bind(ctx) : ctx.send.bind(ctx);
    const channel = ctx instanceof ChatInputCommandInteraction ? ctx.channel! : ctx;

    const { member, thread } = await getModmailContactInfo(!notify)({ _: ctx });

    const settings = await db.modmailSettings.findOne({ guild: ctx.guild!.id });
    if (!settings) return;

    const target = settings.targets.find((x) => x.id === thread.id)!;

    if (member && notify) {
        content ||= await formatCustomMessageString(target.closeMessageParsed, { guild: ctx.guild, member });

        try {
            await member.send({
                embeds: [
                    {
                        title: `Modmail Thread Closed (${ctx.guild!.name})`,
                        description: content,
                        color: await getColor(ctx.guild!),
                        footer: { text: `Server ID: ${ctx.guild!.id}` },
                    },
                ],
            });
        } catch {
            return void (await send(template.error("The user could not be notified. They may have DMs off or have blocked the bot.")));
        }
    }

    await db.modmailThreads.updateOne(
        { channel: channel.id },
        { $set: { closed: true }, $push: { messages: { type: "close", author: user, content, sent: notify, time: Date.now() } } },
    );

    setTimeout(() => (channel.isThread() ? channel.setArchived(true) : channel.delete()), 2500);

    const log = target.logChannel === null ? null : await ctx.guild!.channels.fetch(target.logChannel).catch(() => {});

    if (log?.isTextBased())
        await log.send({
            embeds: [
                {
                    title: "Modmail Thread Closed",
                    description: `The thread with ${expand(member, `Missing Member: \`${thread.user}\``)} was closed.`,
                    color: colors.actions.delete,
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: ButtonStyle.Link, label: "View on Dashboard", url: `${Bun.env.DOMAIN}/modmail/${thread.uuid}` },
                    ],
                },
            ],
        });

    await send({
        embeds: [
            {
                title: "Modmail Thread Closed",
                description: notify ? "The recipient was notified." : "No notification was sent.",
                color: await getColor(ctx.guild!),
            },
        ],
    });
}

export async function loadSnippet<T extends { _: ChatInputCommandInteraction; snippet: string }>(
    data: T,
): Promise<Omit<T, "snippet"> & { snippet: DbModmailSettings["snippets"][0] }> {
    const settings = await db.modmailSettings.findOne({ guild: data._.guild!.id });
    if (!settings) throw "Modmail has not been configured in this server.";

    const snippet = settings.snippets.find((x) => x.name === data.snippet);
    if (!snippet) throw "No snippet exists with that name.";

    return { ...data, snippet };
}
