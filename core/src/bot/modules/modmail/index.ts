import Argentium from "argentium";
import { SlashUtil } from "argentium/src/slash-util.js";
import {
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ComponentType,
    Events,
    Guild,
    Message,
    MessageType,
    TextBasedChannel,
    ThreadAutoArchiveDuration,
    ThreadChannel,
    escapeMarkdown,
} from "discord.js";
import { DbModmailSettings, parseDuration } from "shared";
import { db, getColor, getLimitFor, getPremiumBenefitsFor } from "shared/db.js";
import { formatCustomMessageString } from "shared/format-custom-message.js";
import { fuzzy } from "../../../lib/utils.js";
import { copyMedia } from "../../lib/copy-media.js";
import { colors, embed, mdash, template, timeinfo } from "../../lib/format.js";
import { defer, fetchCaller } from "../../lib/hooks.js";
import { invokeLog } from "../../lib/logging.js";
import { check } from "../../lib/permissions.js";
import { skip } from "../utils.js";
import {
    close,
    confirmRepeatGuild,
    getModmailContactInfo,
    handleReply,
    loadSnippet,
    maybeLogInternalMessage,
    replies,
    resolve,
    resolveVanity,
    selectGuild,
    startModal,
} from "./lib.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (message.author.id === message.client.user.id) return;
            if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return;
            if (message.guild) return void (await maybeLogInternalMessage(message));

            const tracker: [boolean] = [false];
            const files = await copyMedia(message, 1, tracker);

            if (files.length > 10)
                return void (await message.reply(
                    template.error("You have added too many attachments. Please only include up to 10 files and stickers combined."),
                ));

            if (tracker[0])
                return void (await message.reply(
                    template.error("Your sticker was not able to be converted. Please upload it as a file manually or send your message without it."),
                ));

            let guild: Guild | undefined, reply: Message | undefined, exited: boolean | undefined;

            const vanity = await db.guilds.findOne({ token: message.client.token });

            if (vanity) {
                const guild = message.client.guilds.cache.get(vanity.guild);
                if (!guild || (await skip(guild, "modmail"))) return;

                return await resolveVanity(message, guild, files);
            }

            const entry = await db.modmailTargets.findOne({ user: message.author.id });
            if (entry?.guild) guild = message.client.guilds.cache.get(entry.guild);

            if (guild) {
                if (!(await guild.members.fetch({ user: message.author.id, force: true }).catch(() => {}))) guild = undefined;
                else if (await skip(guild, "modmail")) guild = undefined;
                else [reply, guild, exited] = await confirmRepeatGuild(message, guild);

                if (exited) return;
            }

            if (!guild) {
                if (!reply)
                    reply = await message.reply({
                        embeds: [{ title: "Loading...", color: colors.prompts.inProgress }],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "...", disabled: true }],
                            },
                        ],
                    });

                [guild, exited] = await selectGuild(message, reply);
                if (exited) return;
            }

            if (!guild || !reply) return;

            await resolve(message, guild, reply, files);
        })
        .on(Events.MessageUpdate, async (before, after) => {
            if (before.content === after.content) return;
            if (!after.guild) return;
            if (await skip(after.guild, "modmail")) return;

            const thread = await db.modmailThreads.findOne({ channel: after.channel.id });
            if (!thread) return;

            const index = thread.messages.findIndex((x) => x.type === "internal" && x.id === after.id);
            if (index === -1) return;

            await db.modmailThreads.updateOne({ channel: after.channel.id }, { $push: { [`messages.${index}.edits`]: after.content } });
        })
        .on(Events.MessageDelete, async (message) => {
            const thread = await db.modmailThreads.findOne({ channel: message.channel.id });
            if (!thread) return;

            const index = thread.messages.findIndex((x) => x.type === "internal" && x.id === message.id);
            if (index === -1) return;

            await db.modmailThreads.updateOne({ channel: message.channel.id }, { $set: { [`messages.${index}.deleted`]: true } });
        })
        .on(Events.MessageBulkDelete, async (messages) => {
            if (messages.size === 0) return;

            const thread = await db.modmailThreads.findOne({ channel: messages.first()!.channel.id });
            if (!thread) return;

            const indexes: number[] = [];

            thread.messages.forEach((message, index) => message.type === "internal" && message.id && messages.has(message.id) && indexes.push(index));

            if (indexes.length > 0)
                await db.modmailThreads.updateOne(
                    { channel: messages.first()!.channel.id },
                    { $set: Object.fromEntries(indexes.map((index) => [`messages.${index}.deleted`, true])) },
                );
        })
        .commands((x) =>
            x
                .slash((x) =>
                    x
                        .key("modmail reply")
                        .description("reply to a modmail thread")
                        .stringOption("content", "the content of the reply")
                        .use(addReplyOptions)
                        .fn(async ({ _, ...data }) => {
                            const reply = await _.deferReply();
                            return { _, ...data, reply };
                        })
                        .fn(getModmailContactInfo(false))
                        .fn(fetchCaller)
                        .fn(async ({ _, caller, member, thread, anon, content, reply, ...filemap }) => {
                            return await handleReply(_, caller, member, !!anon, content ?? undefined, filemap);
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail reply-modal")
                        .description("reply to a modmail thread, entering content in a modal (allows multi-line)")
                        .use(addReplyOptions)
                        .fn(getModmailContactInfo(false))
                        .fn(fetchCaller)
                        .fn(async ({ _, caller, member, thread, anon, ...filemap }) => {
                            await startModal(_, caller, member, !!anon, undefined, filemap);
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail close")
                        .description("close a modmail thread")
                        .booleanOption("notify", "if true, notify the user that the modmail thread has been closed")
                        .stringOption("content", "the content for the notification which is also stored in the logs (leave blank to use the default)")
                        .stringOption("delay", "how long to wait before auto-closing (recipient is always notified; canceled if a message is sent)")
                        .fn(defer(false))
                        .fn(async ({ _, notify, content, delay: _delay }) => {
                            const delay = _delay ? parseDuration(_delay, false) : 0;

                            if (delay > 0) {
                                const { member } = await getModmailContactInfo(false)({ _ });

                                const time = Date.now() + delay;

                                await db.tasks.updateOne(
                                    { action: "modmail/close", guild: _.guild!.id, channel: _.channel!.id },
                                    { $set: { author: _.user.id, notify: !!notify, message: content, time } },
                                    { upsert: true },
                                );

                                try {
                                    await member.send({
                                        embeds: [
                                            {
                                                title: `Modmail Thread Close Scheduled (${escapeMarkdown(_.guild!.name)})`,
                                                description: `This thread will be closed at ${timeinfo(
                                                    time,
                                                )} unless you or the server staff sends another message.`,
                                                color: await getColor(_.guild!),
                                                footer: { text: `Server ID: ${_.guild!.id}` },
                                            },
                                        ],
                                    });
                                } catch {
                                    throw `The user could not be notified. They may have DMs off or have blocked the bot. The thread will still automatically close at ${timeinfo(
                                        time,
                                    )}${content ? ", unless notifying them at the time of closing fails again." : "."}`;
                                }

                                return {
                                    embeds: [
                                        {
                                            title: "Modmail Thread Close Scheduled",
                                            description: `This thread will be closed at ${timeinfo(time)} unless you or the recipient sends another message.`,
                                            color: await getColor(_.guild!),
                                        },
                                    ],
                                };
                            }

                            await close(_, _.user.id, !!notify, content ?? "");
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail contact")
                        .description("open a modmail thread with a server member (they will not be informed until a message is sent)")
                        .userOption("user", "the user to contact", { required: true })
                        .fn(defer(true))
                        .fn(async ({ _, user }) => {
                            if (user.bot) throw "Bots are not able to DM other bots. You cannot use modmail to contact a bot.";

                            await _.guild!.members.fetch(user).catch(() => {
                                throw `${user} is not in this server.`;
                            });

                            const settings = await db.modmailSettings.findOne({ guild: _.guild!.id });

                            const unfiltered =
                                settings?.targets
                                    .slice(
                                        0,
                                        settings.multi && (await getPremiumBenefitsFor(_.guild!.id)).multiModmail
                                            ? await getLimitFor(_.guild!, "modmailTargetCount")
                                            : 1,
                                    )
                                    .filter((x) => !!x.logChannel && (x.useThreads || !!x.category)) ?? [];

                            const targets: DbModmailSettings["targets"] = [];

                            for (const target of unfiltered) {
                                const channel = await _.guild!.channels.fetch(target.logChannel!).catch(() => {});
                                if (!channel) continue;
                                if (await check(_.user, "modmail", channel)) continue;

                                targets.push(target);
                            }

                            const color = await getColor(_.guild!);

                            if (targets.length === 0)
                                throw "You do not have permission to do this in any modmail targets or this server's modmail configuration is invalid or incomplete.";

                            let target: DbModmailSettings["targets"][0];

                            if (targets.length === 1) [target] = targets;
                            else {
                                const reply = await _.editReply({
                                    embeds: [
                                        {
                                            title: "**Select Modmail Target**",
                                            description: "Please select the target in which to open your modmail message. You have 2 minutes to decide.",
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
                                                "An unexpected error occurred (selected target is invalid). This appears to be our fault; please contact support if this issue persists.",
                                            ),
                                        ));
                                } catch {
                                    return void (await reply.edit(replies.timedOut));
                                }
                            }

                            const entry = await db.modmailThreads.findOne({ guild: _.guild!.id, user: user.id, id: target.id });
                            const fetched = entry && (await _.guild!.channels.fetch(entry.channel).catch(() => null));

                            if (!(entry?.closed ?? true) && (target.useThreads ? fetched?.isThread() : fetched?.isTextBased() && !fetched.isThread()))
                                return void (await _.editReply(template.error(`This user already has an open modmail thread: ${fetched}.`)));
                            if (fetched && !fetched!.isTextBased()) throw "Invalid channel type. This error should never occur.";

                            let channel: TextBasedChannel | ThreadChannel | undefined | null = fetched;

                            if (!channel)
                                if (target.useThreads) {
                                    let error: any;
                                    const root = await _.guild!.channels.fetch(target.logChannel!).catch((e) => void _.editReply(template.error((error = e))));
                                    if (error) return;

                                    if (!root || !("threads" in root))
                                        return void (await _.editReply(
                                            template.error("Invalid channel: root channel does not exist or cannot contain threads."),
                                        ));
                                    else
                                        channel = await root.threads
                                            .create({
                                                name: user.tag,
                                                message: embed("New Modmail Thread", `This modmail thread is with ${user}.`, color),
                                                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                                            })
                                            .catch((e) => void _.editReply(template.error(`${e}`)));
                                } else {
                                    let error: any;
                                    const root = await _.guild!.channels.fetch(target.category!).catch((e) => void _.editReply(template.error((error = e))));
                                    if (error) return;

                                    if (root?.type !== ChannelType.GuildCategory)
                                        return void (await _.editReply(template.error("Invalid channel: root channel does not exist or is not a category.")));
                                    else
                                        channel =
                                            root.children.cache.size >= 50
                                                ? await root.guild.channels
                                                      .create({ name: user.tag, permissionOverwrites: root.permissionOverwrites.cache })
                                                      .catch((e) => void _.editReply(template.error(`${e}`)))
                                                : await root.children.create({ name: user.tag }).catch((e) => void _.editReply(template.error(`${e}`)));
                                }

                            if (!channel) return;

                            if (!target.useThreads) {
                                try {
                                    const log = await _.guild!.channels.fetch(target.logChannel!);

                                    if (!log) throw `Log channel (${target.logChannel}) does not exist or cannot be seen by the bot.`;
                                    if (!log?.isTextBased()) throw `Log channel (${target.logChannel}) is of the wrong channel type.`;

                                    await log.send(
                                        embed("New Modmail Thread", `A modmail thread was just opened with ${user}: ${channel}.`, colors.statuses.success),
                                    );
                                } catch (error) {
                                    invokeLog("botError", _.guild!, () =>
                                        template.logerror(`Bot Error ${mdash} Modmail`, `Error posting log message:\n\`\`\`\n${error}\n\`\`\``),
                                    );
                                }
                            }

                            let uuid: string;

                            do {
                                uuid = crypto.randomUUID();
                            } while ((await db.modmailThreads.countDocuments({ uuid })) > 0);

                            await db.modmailThreads.updateOne(
                                { guild: _.guild!.id, user: user.id, id: target.id },
                                {
                                    $setOnInsert: { uuid },
                                    $set: { closed: false, channel: channel.id },
                                    $push: {
                                        messages: { type: "open", author: _.user.id, time: Date.now(), targetName: target.id === -1 ? null : target.name },
                                    },
                                },
                                { upsert: true },
                            );

                            await channel
                                .send({
                                    embeds: [
                                        {
                                            title: "Modmail Thread Opened",
                                            description: `This modmail thread was just opened by ${_.user} to contact ${user}.`,
                                            color,
                                        },
                                    ],
                                })
                                .catch((error) =>
                                    invokeLog("botError", _.guild!, () =>
                                        template.logerror(
                                            `Bot Error ${mdash} Modmail`,
                                            `Error posting modmail initialization message:\n\`\`\`\n${error}\n\`\`\``,
                                        ),
                                    ),
                                );

                            await _.editReply(template.success(`${channel}`));
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail log-link")
                        .description("get the link to the logs on the dashboard for the current modmail thread")
                        .fn(async ({ _ }) => {
                            const entry = await db.modmailThreads.findOne({ channel: _.channel!.id });
                            if (!entry) throw "This is not a modmail thread.";

                            return {
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                style: ButtonStyle.Link,
                                                label: "View on Dashboard",
                                                url: `${Bun.env.DOMAIN}/modmail/${entry.uuid}`,
                                            },
                                        ],
                                    },
                                ],
                            };
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail snippet send")
                        .description("send a snippet (you will be able to inspect and confirm before sending)")
                        .use(addSnippetOption)
                        .use(addSnippetSendOption)
                        .fn(getModmailContactInfo(false))
                        .fn(fetchCaller)
                        .fn(loadSnippet)
                        .fn(async ({ _, caller, anon, snippet, member }) => {
                            const content = await formatCustomMessageString(snippet.parsed, { guild: _.guild!, member }).catch((error) => {
                                throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                            });

                            const message = await _.reply({
                                embeds: [
                                    {
                                        title: `Confirm sending snippet "${escapeMarkdown(snippet.name)}"?`,
                                        description: content,
                                        color: await getColor(_.guild!),
                                        footer: { text: "You have 5 minutes to confirm." },
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

                            let response: ButtonInteraction;

                            try {
                                response = await message.awaitMessageComponent({
                                    componentType: ComponentType.Button,
                                    filter: (x) => x.user.id === _.user.id,
                                    time: 300000,
                                });

                                if (response.customId === "cancel")
                                    return void (await response.update({
                                        embeds: [{ title: "Canceled", description: "This message was canceled.", color: colors.prompts.canceled }],
                                        components: [],
                                    }));
                            } catch {
                                return void (await _.editReply({
                                    embeds: [
                                        {
                                            title: "Timed Out",
                                            description: "You did not respond in time. Please call this command again to try again.",
                                            color: colors.prompts.canceled,
                                        },
                                    ],
                                    components: [],
                                }));
                            }

                            const reply = await response.deferUpdate();

                            try {
                                await response.editReply(await handleReply(_, caller, member, !!anon, content, {}));
                            } catch (error) {
                                await response.editReply(template.error(`${error}`));
                            }
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail snippet view")
                        .description("view a snippet's content")
                        .use(addSnippetOption)
                        .fn(fetchCaller)
                        .fn(loadSnippet)
                        .fn(async ({ _, caller, snippet }) => {
                            const content = await formatCustomMessageString(snippet.parsed, { guild: _.guild, member: caller }).catch((error) => {
                                throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                            });

                            return {
                                embeds: [
                                    {
                                        title: `Preview Snippet "${escapeMarkdown(snippet.name)}"`,
                                        description: content,
                                        color: await getColor(_.guild!),
                                        footer: {
                                            text: "This message is formatted as though you were the recipient. When sent, names and other values will be replaced with the recipient's data (if applicable).",
                                        },
                                    },
                                ],
                                ephemeral: true,
                            };
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail snippet use-as-template")
                        .description("use a snippet as a template and edit the content before sending")
                        .use(addSnippetOption)
                        .use(addSnippetSendOption)
                        .fn(getModmailContactInfo(false))
                        .fn(fetchCaller)
                        .fn(loadSnippet)
                        .fn(
                            async ({ _, caller, member, anon, snippet }) =>
                                await startModal(
                                    _,
                                    caller,
                                    member,
                                    !!anon,
                                    await formatCustomMessageString(snippet.parsed, { guild: _.guild, member }).catch((error) => {
                                        throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                                    }),
                                    {},
                                ),
                        ),
                )
                .slash((x) =>
                    x
                        .key("modmail notify")
                        .description("set ping notifications for this thread")
                        .stringOption("mode", "the notification setting", {
                            required: true,
                            choices: { off: "off (no notifications)", once: "once (next message)", all: "subscribe (all messages)" },
                        })
                        .fn(getModmailContactInfo(true))
                        .fn(async ({ _, mode }) => {
                            if (mode === "off") await db.modmailNotifications.deleteOne({ channel: _.channel!.id, user: _.user.id });
                            else
                                await db.modmailNotifications.updateOne(
                                    { channel: _.channel!.id, user: _.user.id },
                                    { $set: { once: mode === "once" } },
                                    { upsert: true },
                                );

                            return template.success(
                                {
                                    off: "You will no longer receive notification pings for this thread.",
                                    once: "You will be pinged for the next incoming message in this thread.",
                                    all: "You will be pinged for all subsequent incoming messages in this thread.",
                                }[mode],
                            );
                        }),
                )
                .slash((x) =>
                    x
                        .key("modmail nsfw")
                        .description("set the channel's NSFW status")
                        .booleanOption("nsfw", "whether or not the channel should be marked as NSFW", { required: true })
                        .fn(getModmailContactInfo(true))
                        .fn(async ({ _, nsfw }) => {
                            if (_.channel!.isDMBased()) throw "?";
                            if (_.channel!.isThread()) throw "This feature only works in plain text channels and not threads.";
                            if (nsfw && _.channel!.nsfw) throw "This thread is already marked as NSFW.";
                            if (!nsfw && !_.channel!.nsfw) throw "This thread is not marked as NSFW.";

                            await _.channel!.edit({ nsfw });
                            return template.success(`This thread has been marked as ${nsfw ? "NSFW" : "SFW"}.`, false);
                        }),
                ),
        );

const addReplyOptions = <T>(x: SlashUtil<T>) =>
    x
        .booleanOption("anon", "if true, hide your name and top role in the reply")
        .fileOption("file-1", "a file to include in the reply")
        .fileOption("file-2", "a file to include in the reply")
        .fileOption("file-3", "a file to include in the reply")
        .fileOption("file-4", "a file to include in the reply")
        .fileOption("file-5", "a file to include in the reply")
        .fileOption("file-6", "a file to include in the reply")
        .fileOption("file-7", "a file to include in the reply")
        .fileOption("file-8", "a file to include in the reply")
        .fileOption("file-9", "a file to include in the reply")
        .fileOption("file-10", "a file to include in the reply");

const addSnippetOption = <T>(x: SlashUtil<T>) =>
    x.stringOption("snippet", "the name of the snippet", {
        required: true,
        maxLength: 100,
        async autocomplete(query, _) {
            const settings = await db.modmailSettings.findOne({ guild: _.guild!.id });
            if (!settings) return [];

            return settings.snippets
                .filter((x) => fuzzy(x.name, query))
                .map((x, i) => ({ name: x.name, value: x.name.slice(0, 100) }))
                .slice(0, 25);
        },
    });

const addSnippetSendOption = <T>(x: SlashUtil<T>) => x.booleanOption("anon", "if true, hide your name and top role in the reply");
