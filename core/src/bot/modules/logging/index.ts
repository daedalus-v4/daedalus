import Argentium from "argentium";
import {
    APIEmbed,
    AuditLogEvent,
    ChannelType,
    Events,
    Guild,
    GuildChannel,
    MessageCreateOptions,
    MessageFlags,
    OverwriteType,
    PermissionsBitField,
    escapeMarkdown,
} from "discord.js";
import { DurationStyle, formatDuration, permissions } from "shared";
import { getAllClients } from "../../clients.js";
import { SpoilerLevel, copyFiles, copyMedia } from "../../lib/copy-media.js";
import { code, colors, embed, englishList, expand, mdash, timeinfo } from "../../lib/format.js";
import getMuteRole from "../../lib/get-mute-role.js";
import { invokeLog } from "../../lib/logging.js";
import stickerCache from "../../lib/sticker-cache.js";
import { archiveDurations, audit, auditEntry, channelTypes, fieldsFor, statuses, to } from "./utils.js";

export default (app: Argentium) =>
    app
        .on(Events.ChannelCreate, (channel) =>
            invokeLog("channelCreate", channel, async () => {
                const user = await audit(channel.guild, AuditLogEvent.ChannelCreate, channel);
                return embed("Channel Created", `${expand(user, "System")} created ${expand(channel)}`, colors.actions.create);
            }),
        )
        .on(
            Events.ChannelDelete,
            (channel) =>
                !channel.isDMBased() &&
                invokeLog("channelDelete", channel, async () => {
                    const user = await audit(channel.guild, AuditLogEvent.ChannelDelete, channel);
                    return embed(
                        "Channel Deleted",
                        `${expand(user, "System")} deleted ${channelTypes[channel.type]} ${channel.name} (\`${channel.id}\`)`,
                        colors.actions.delete,
                    );
                }),
        )
        .on(
            Events.ChannelUpdate,
            (before, after) =>
                !before.isDMBased() &&
                !after.isDMBased() &&
                invokeLog("channelUpdate", after, async () => {
                    for (const section of [0, 1]) {
                        const rows = [];

                        if (section === 0) {
                            if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);
                            if (before.type !== after.type) rows.push(`- type: ${code(channelTypes[before.type])} ${to} ${code(channelTypes[after.type])}`);

                            if (before.parentId !== after.parentId)
                                rows.push(
                                    `- category: ${before.parent ? `${before.parent.name} (\`${before.parent.id}\`)` : "(none)"} ${to} ${
                                        after.parent ? `${after.parent.name} (\`${after.parent.id}\`)` : "(none)"
                                    }`,
                                );

                            if ("nsfw" in before && "nsfw" in after && before.nsfw !== after.nsfw)
                                rows.push(`- NSFW: ${code(before.nsfw ? "on" : "off")} ${to} ${code(after.nsfw ? "on" : "off")}`);

                            if ("topic" in before && "topic" in after && (before.topic || after.topic) && before.topic !== after.topic)
                                rows.push(`- topic: ${before.topic ? code(before.topic) : "(none)"} ${to} ${after.topic ? code(after.topic) : "(none)"}`);

                            if (
                                "defaultAutoArchiveDuration" in before &&
                                "defaultAutoArchiveDuration" in after &&
                                before.defaultAutoArchiveDuration !== after.defaultAutoArchiveDuration
                            )
                                rows.push(
                                    `- default auto-archive duration: ${code(archiveDurations[before.defaultAutoArchiveDuration ?? 0])} ${to} ${code(
                                        archiveDurations[after.defaultAutoArchiveDuration ?? 0],
                                    )}`,
                                );

                            if (before.isVoiceBased() && after.isVoiceBased()) {
                                if (before.bitrate !== after.bitrate)
                                    rows.push(`- bitrate: \`${Math.floor(before.bitrate / 1000)}kbps\` ${to} \`${Math.floor(after.bitrate / 1000)}kbps\``);

                                if (before.rtcRegion !== after.rtcRegion) rows.push(`- RTC region: \`${before.rtcRegion}\` ${to} \`${after.rtcRegion}\``);
                                if (before.userLimit !== after.userLimit) rows.push(`- user limit: \`${before.userLimit}\` ${to} \`${after.userLimit}\``);
                            }

                            if (before.isTextBased() && after.isTextBased() && (before.rateLimitPerUser ?? 0) !== (after.rateLimitPerUser ?? 0))
                                rows.push(
                                    `- slowmode: ${formatDuration((before.rateLimitPerUser ?? 0) * 1000)} ${to} ${formatDuration(
                                        (after.rateLimitPerUser ?? 0) * 1000,
                                    )}`,
                                );
                        } else {
                            const permsBefore = new Map<string, string>();
                            const permsAfter = new Map<string, string>();

                            for (const [channel, perms] of [
                                [before, permsBefore],
                                [after, permsAfter],
                            ] satisfies [GuildChannel, Map<string, string>][]) {
                                for (const overwrites of channel.permissionOverwrites.cache.values()) {
                                    const label = `<@${{ [OverwriteType.Role]: "&", [OverwriteType.Member]: "" }[overwrites.type]}${overwrites.id}>`;

                                    for (const [set, key] of [
                                        [overwrites.allow, "✅"],
                                        [overwrites.deny, "❌"],
                                    ] satisfies [Readonly<PermissionsBitField>, string][])
                                        for (const permission of set.toArray()) perms.set(`${label}: ${code(permission)}`, key);
                                }
                            }

                            for (const key of [...new Set([...permsBefore.keys(), ...permsAfter.keys()])])
                                if (permsBefore.get(key) !== permsAfter.get(key))
                                    rows.push(`- ${key}: ${permsBefore.get(key) ?? "🟨"} ${to} ${permsAfter.get(key) ?? "🟨"}`);
                        }

                        if (rows.length === 0) continue;

                        const entry =
                            section === 0
                                ? await auditEntry(after.guild, AuditLogEvent.ChannelUpdate, after)
                                : (
                                      await Promise.all(
                                          ["Create", "Update", "Delete"].map((k) =>
                                              auditEntry(after.guild, AuditLogEvent[`ChannelOverwrite${k}` as keyof typeof AuditLogEvent], after),
                                          ),
                                      )
                                  )
                                      .filter((x) => x)
                                      .sort((a, b) => b!.createdTimestamp - a!.createdTimestamp)[0];

                        const user = entry?.executor;

                        const blocks = [`${expand(user, "System")} updated ${expand(after)}\n`];

                        for (const row of rows) {
                            const next = `${blocks.at(-1)}\n${row}`;
                            if (next.length > 4096) blocks.push(row);
                            else blocks[blocks.length - 1] = next;
                        }

                        return [
                            embed("Channel Updated", blocks.shift()!, colors.actions.update),
                            ...blocks.map((block) => embed("...continued", block, colors.continued)),
                        ];
                    }
                }),
        )
        .on(Events.GuildEmojiCreate, (emoji) =>
            invokeLog("emojiCreate", emoji.guild, async () => {
                const user = await audit(emoji.guild, AuditLogEvent.EmojiCreate, emoji);

                return {
                    embeds: [
                        {
                            title: "Emoji Created",
                            description: `${expand(user, "System")} created ${emoji} (:${emoji.name}: ${code(emoji.id)})`,
                            color: colors.actions.create,
                            thumbnail: { url: emoji.url },
                        },
                    ],
                };
            }),
        )
        .on(Events.GuildEmojiDelete, (emoji) =>
            invokeLog("emojiDelete", emoji.guild, async () => {
                const user = await audit(emoji.guild, AuditLogEvent.EmojiDelete, emoji);

                return {
                    embeds: [
                        {
                            title: "Emoji Deleted",
                            description: `${expand(user, "System")} deleted :${emoji.name}: ${code(emoji.id)}`,
                            color: colors.actions.delete,
                            thumbnail: { url: emoji.url },
                        },
                    ],
                };
            }),
        )
        .on(Events.GuildEmojiUpdate, (before, after) =>
            invokeLog("emojiUpdate", after.guild, async () => {
                const user = await audit(after.guild, AuditLogEvent.EmojiUpdate, after);
                const enabled = after.roles.cache.filter((role) => !before.roles.cache.has(role.id));
                const disabled = before.roles.cache.filter((role) => !after.roles.cache.has(role.id));

                return {
                    embeds: [
                        {
                            title: "Emoji Updated",
                            description: `${expand(user, "System")} updated ${after} (:${after.name}: \`${after.id}\`)\n${
                                before.name !== after.name ? `\n- name: ${code(before.name ?? "")} ${to} ${code(after.name ?? "")}` : ""
                            }${enabled.size > 0 ? `\n- enabled emoji for ${englishList([...enabled.values()])}` : ""}${
                                disabled.size > 0 ? `\n- disabled emoji for ${englishList([...disabled.values()])}` : ""
                            }`,
                            color: colors.actions.update,
                            thumbnail: { url: after.url },
                        },
                    ],
                };
            }),
        )
        .on(Events.GuildBanAdd, (ban) =>
            invokeLog("guildBanAdd", ban.guild, async () => {
                if (ban.partial) ban = await ban.fetch();

                const user = await audit(ban.guild, AuditLogEvent.MemberBanAdd, ban.user);

                return embed(
                    "User Banned",
                    `${expand(user, "Unknown User")} banned ${expand(ban.user)}${ban.reason ? ` with reason ${code(ban.reason)}` : ""}`,
                    colors.actions.delete,
                );
            }),
        )
        .on(Events.GuildBanRemove, (ban) =>
            invokeLog("guildBanRemove", ban.guild, async () => {
                const entry = await auditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user);

                return embed(
                    "User Unbanned",
                    `${expand(entry?.executor, "Unknown User")} unbanned ${expand(ban.user)}${entry?.reason ? ` with reason ${code(entry.reason)}` : ""}`,
                    colors.actions.create,
                );
            }),
        )
        .on(Events.GuildMemberAdd, (member) =>
            invokeLog("guildMemberAdd", member.guild, async () =>
                embed(
                    "Member Joined",
                    `${expand(member)} just joined the server ${mdash} account was created ${formatDuration(
                        Date.now() - member.user.createdTimestamp,
                        DurationStyle.Blank,
                    )} ago${member.user.bot ? ` (added by ${expand(await audit(member.guild, AuditLogEvent.BotAdd, member), "Unknown User")})` : ""}`,
                    colors.actions.create,
                ),
            ),
        )
        .on(Events.GuildMemberRemove, async (member) => {
            const entry = await auditEntry(member.guild, AuditLogEvent.MemberKick, member);

            if (entry)
                invokeLog("guildMemberKick", member.guild, () =>
                    embed(
                        "Member Kicked",
                        `${expand(entry.executor, "Unknown User")} kicked ${expand(member)}${entry.reason ? ` with reason ${code(entry.reason)}` : ""}`,
                        colors.actions.delete,
                    ),
                );

            invokeLog("guildMemberRemove", member.guild, () =>
                embed(
                    "Member Left",
                    `${expand(member)} just left the server ${mdash} joined ${formatDuration(
                        Date.now() - (member.joinedTimestamp ?? Date.now()),
                        DurationStyle.Blank,
                    )} ago`,
                    colors.actions.delete,
                ),
            );
        })
        .on(Events.GuildMemberUpdate, async (before, after) => {
            const entry = await auditEntry(after.guild, AuditLogEvent.MemberUpdate, after);

            const user = entry?.executor;
            const reason = entry?.reason ? ` with reason code(${entry.reason})` : "";

            if (before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp)
                if ((before.communicationDisabledUntilTimestamp ?? 0) <= Date.now())
                    invokeLog("guildMemberTimeout", after.guild, () =>
                        embed(
                            "Member Timed Out",
                            `${expand(user, "System")} timed out ${expand(after)} until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                            colors.actions.delete,
                        ),
                    );
                else if ((after.communicationDisabledUntilTimestamp ?? 0) <= Date.now())
                    invokeLog("guildMemberTimeoutRemove", after.guild, () =>
                        embed(
                            "Member Timeout Removed",
                            `${expand(user, "System")} removed the timeout for ${expand(after)} originally until ${timeinfo(
                                before.communicationDisabledUntil!,
                            )}${reason}`,
                            colors.actions.create,
                        ),
                    );
                else
                    invokeLog("guildMemberTimeout", after.guild, () =>
                        embed(
                            "Member Timeout Duration Changed",
                            `${expand(user, "System")} changed the timeout for ${expand(after)} from until ${timeinfo(
                                before.communicationDisabledUntil!,
                            )} to until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                            colors.actions.update,
                        ),
                    );

            if (before.nickname !== after.nickname)
                invokeLog("guildMemberUpdateName", after.guild, () =>
                    embed(
                        "Member Display Name Changed",
                        `${expand(user, "Unknown User")} changed ${user?.id === after.id ? "their own" : `${expand(after)}'s`} nickname from ${
                            before.nickname ? code(before.nickname) : "(none)"
                        } to ${after.nickname ? code(after.nickname) : "(none)"}`,
                        colors.actions.update,
                    ),
                );

            const beforeAvatar = before.displayAvatarURL({ size: 256 });
            const afterAvatar = after.displayAvatarURL({ size: 256 });

            if (beforeAvatar !== afterAvatar)
                invokeLog("guildMemberUpdateAvatar", after.guild, () => ({
                    embeds: [
                        { title: "Member Avatar Changed From...", description: expand(after), color: colors.actions.update, thumbnail: { url: beforeAvatar } },
                        { title: "...To", color: colors.actions.update, thumbnail: { url: afterAvatar } },
                    ],
                }));

            if (!before.roles.cache.equals(after.roles.cache)) {
                const added = after.roles.cache.filter((role) => !before.roles.cache.has(role.id));
                const removed = before.roles.cache.filter((role) => !after.roles.cache.has(role.id));

                const roleEditEntry = await auditEntry(after.guild, AuditLogEvent.MemberRoleUpdate, after);
                const roleEditor = roleEditEntry?.executor;
                const reason = roleEditEntry?.reason ? ` with reason ${code(roleEditEntry.reason)}` : "";

                invokeLog("guildMemberUpdateRoles", after.guild, () =>
                    embed(
                        "Member Roles Updated",
                        `${expand(roleEditor, "System")} updated ${roleEditor?.id === after.id ? "their own" : `${expand(after)}'s`} roles: ${[
                            ...added.map((x) => `+${x}`),
                            ...removed.map((x) => `-${x}`),
                        ].join(", ")}`,
                        colors.actions.update,
                    ),
                );

                const muteRole = await getMuteRole(after.guild);

                if (muteRole) {
                    const mutedBefore = before.roles.cache.has(muteRole.id);
                    const mutedAfter = after.roles.cache.has(muteRole.id);

                    if (!mutedBefore && mutedAfter)
                        invokeLog("guildMemberMute", after.guild, () =>
                            embed("Member Muted", `${expand(roleEditor, "Unknown User")} muted ${expand(after)}${reason}`, colors.actions.delete),
                        );
                    else if (mutedBefore && !mutedAfter)
                        invokeLog("guildMemberUnmute", after.guild, () =>
                            embed("Member Unmuted", `${expand(roleEditor, "Unknown User")} unmuted ${expand(after)}${reason}`, colors.actions.create),
                        );
                }
            }
        })
        .on(
            Events.GuildScheduledEventCreate,
            (event) =>
                event.guild &&
                invokeLog("guildScheduledEventCreate", event.channel ?? event.guild, () => ({
                    embeds: [
                        {
                            title: "Event Created",
                            description: `${expand(event.creator, "Unknown User")} created the event ${code(event.name)}${
                                event.channel ? ` in ${expand(event.channel)}` : ""
                            }`,
                            color: colors.actions.create,
                            image: ((url) => (url === null ? undefined : { url }))(event.coverImageURL({ size: 1024 })),
                        },
                    ],
                })),
        )
        .on(
            Events.GuildScheduledEventDelete,
            (event) =>
                event.guild &&
                invokeLog("guildScheduledEventDelete", event.channel ?? event.guild, async () => {
                    const user = await audit(event.guild!, AuditLogEvent.GuildScheduledEventDelete, event);

                    return {
                        embeds: [
                            {
                                title: "Event Deleted",
                                description: `${expand(user, "Unknown User")} deleted the event ${event.name}${
                                    event.channel ? ` in ${expand(event.channel)}` : ""
                                }`,
                                color: colors.actions.delete,
                                image: ((url) => (url === null ? undefined : { url }))(event.coverImageURL({ size: 1024 })),
                            },
                        ],
                    };
                }),
        )
        .on(
            Events.GuildScheduledEventUpdate,
            (before, after) =>
                before &&
                after.guild &&
                invokeLog("guildScheduledEventUpdate", after.channel ?? after.guild, async () => {
                    const user = await audit(after.guild!, AuditLogEvent.GuildScheduledEventUpdate, after);

                    const embeds: APIEmbed[] = [
                        {
                            title: "Event Updated",
                            description: `${expand(user, "Unknown User")} updated the event ${after.name}${
                                after.channel ? ` in ${expand(after.channel)}` : ""
                            }`,
                            color: colors.actions.update,
                        },
                    ];

                    const rows = [];

                    if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);

                    if (before.channelId !== after.channelId)
                        rows.push(
                            `- location: ${before.channel ? expand(before.channel) : "(other location)"} ${to} ${
                                after.channel ? expand(after.channel) : "(other location)"
                            }`,
                        );

                    if (before.scheduledStartTimestamp !== after.scheduledStartTimestamp)
                        rows.push(`- start: ${timeinfo(before.scheduledStartAt)} ${to} ${timeinfo(after.scheduledStartAt)}`);

                    if (before.scheduledEndTimestamp !== after.scheduledEndTimestamp)
                        rows.push(
                            `- end: ${before.scheduledEndAt ? timeinfo(before.scheduledEndAt) : "(undefined)"} ${to} ${
                                after.scheduledEndAt ? timeinfo(after.scheduledEndAt) : "(undefined)"
                            }`,
                        );

                    if (before.description !== after.description) rows.push(`- description: ${before.description} ${to} ${after.description}`);

                    if (before.status !== after.status) rows.push(`- status: ${code(statuses[before.status])} ${to} ${code(statuses[after.status])}`);

                    if (rows.length > 0) embeds[0].description += `\n\n${rows.join("\n")}`;

                    if (before.image !== after.image)
                        if (before.image)
                            if (after.image)
                                embeds.push(
                                    {
                                        title: "Image Changed From...",
                                        color: colors.actions.update,
                                        image: { url: `https://cdn.discordapp.com/guild-events/${before.id}/${before.image}?size=3072` },
                                    },
                                    {
                                        title: "...To",
                                        color: colors.actions.update,
                                        image: { url: `https://cdn.discordapp.com/guild-events/${after.id}/${after.image}?size=3072` },
                                    },
                                );
                            else
                                embeds.push({
                                    title: "Image Removed",
                                    color: colors.actions.delete,
                                    image: { url: `https://cdn.discordapp.com/guild-events/${before.id}/${before.image}?size=3072` },
                                });
                        else
                            embeds.push({
                                title: "Image Added",
                                color: colors.actions.create,
                                image: { url: `https://cdn.discordapp.com/guild-events/${after.id}/${after.image}?size=3072` },
                            });

                    if (rows.length === 0 && embeds.length === 1) return;
                    return { embeds };
                }),
        )
        .on(Events.GuildUpdate, (before, after) =>
            invokeLog("guildUpdate", after, async () => {
                const user = await audit(after, AuditLogEvent.GuildUpdate, after);

                const outputs: MessageCreateOptions[] = [];

                if (before.ownerId !== after.ownerId) {
                    const previousOwner = await after.client.users.fetch(before.ownerId).catch(() => {});

                    outputs.push(
                        embed(
                            "Ownership Transferred",
                            `${expand(previousOwner, code(before.ownerId))} transferred ownership of the server to ${expand(
                                await after.members.fetch(after.ownerId),
                            )}`,
                            colors.actions.importantUpdate,
                        ),
                    );
                }

                if (before.partnered !== after.partnered)
                    outputs.push(
                        after.partnered
                            ? embed("Guild Became Partner", "This server is now a Discord partner", colors.actions.create)
                            : embed("Guild Lost Partnership", "This server is no longer a Discord partner", colors.actions.delete),
                    );

                if (before.verified !== after.verified)
                    outputs.push(
                        after.verified
                            ? embed("Guild Became Verified", "This guild is now verified", colors.actions.create)
                            : embed("Guild Lost Verification", "This server is no longer verified", colors.actions.delete),
                    );

                function diff<T>(
                    name: string,
                    src: T,
                    dst: T,
                    translate: (item: T) => string | undefined | null = (x) => (x === undefined ? undefined : x === null ? null : `${x}`),
                ) {
                    return src !== dst ? { name, value: `${translate(src) ?? "(none)"} ${to} ${translate(dst) ?? "(none)"}` } : [];
                }

                function diffByKey<T extends keyof Guild>(name: string, key: `${T}Id` extends keyof Guild ? T : never) {
                    return before[`${key}Id` as keyof Guild] !== after[`${key}Id` as keyof Guild]
                        ? { name, value: `${before[key] ?? "(none)"} ${to} ${after[key] ?? "(none)"}` }
                        : [];
                }

                const fields = [
                    diff("Name", before.name, after.name, code),
                    diff("Description", before.description ?? "", after.description ?? "", code),
                    diffByKey("AFK Channel", "afkChannel"),
                    diff("AFK Timeout (seconds)", before.afkTimeout, after.afkTimeout, (x) => code(`${x}`)),
                    diffByKey("Public Updates Channel", "publicUpdatesChannel"),
                    diffByKey("Rules Channel", "rulesChannel"),
                    diffByKey("System Channel", "systemChannel"),
                    diffByKey("Widget Channel", "widgetChannel"),
                    diff(
                        "Default Message Notifications",
                        before.defaultMessageNotifications,
                        after.defaultMessageNotifications,
                        (x) => ["`All Messages`", "`Only Mentions`"][x],
                    ),
                    diff(
                        "Explicit Content Filter",
                        before.explicitContentFilter,
                        after.explicitContentFilter,
                        (x) => ["`Disabled`", "`Members Without Roles`", "`All Members`"][x],
                    ),
                    diff("2FA Moderation Requirement", before.mfaLevel, after.mfaLevel, (x) => ["`Disabled`", "`Enabled`"][x]),
                    diff("NSFW Level", before.nsfwLevel, after.nsfwLevel, (x) => ["`Default`", "`Explicit`", "`Safe`", "`Age Restricted"][x]),
                    diff("Preferred Locale", before.preferredLocale, after.preferredLocale, code),
                    diff("Boost Progress Bar", before.premiumProgressBarEnabled, after.premiumProgressBarEnabled, (x) => (x ? "`On`" : "`Off`")),
                    before.systemChannelFlags.bitfield !== after.systemChannelFlags.bitfield
                        ? {
                              name: "System Channel Types",
                              value: ((x, y) =>
                                  `\`\`\`diff\n${[
                                      ...y.filter((k) => !x.includes(k)).map((k) => `+ ${k}`),
                                      ...x.filter((k) => !y.includes(k)).map((k) => `- ${k}`),
                                  ].join("\n")}\n\`\`\``)(before.systemChannelFlags.toArray(), after.systemChannelFlags.toArray()),
                          }
                        : [],
                    diff("Vanity URL Code", before.vanityURLCode, after.vanityURLCode, (x) => (x ? code(x) : "(none)")),
                    diff(
                        "Verification Level",
                        before.verificationLevel,
                        after.verificationLevel,
                        (x) =>
                            [
                                "`None`",
                                "`Low (require verified email)`",
                                "`Medium (require registered for 5 minutes)`",
                                "`High (require registered for 10 minutes)`",
                                "`Very High (require verified phone number)`",
                            ][x],
                    ),
                    diff("Icon", before.iconURL(), after.iconURL()),
                    diff("Banner", before.bannerURL(), after.bannerURL()),
                    diff("Invite Splash Background", before.splashURL(), after.splashURL()),
                ].flat();

                if (fields.length !== 0)
                    outputs.push({
                        embeds: [
                            { title: "Guild Updated", description: `${expand(user, "System")} updated this server`, color: colors.actions.update, fields },
                        ],
                    });

                return outputs;
            }),
        )
        .on(
            Events.InviteCreate,
            (invite) =>
                invite.channel &&
                !invite.channel.isDMBased() &&
                invokeLog("inviteCreate", invite.channel, () =>
                    embed(
                        "Invite Created",
                        `${expand(invite.inviter, "System")} created discord.gg/${invite.code} to ${expand(invite.channel)} expiring ${
                            invite.expiresAt ? `at ${timeinfo(invite.expiresAt)}` : "never"
                        }`,
                        colors.actions.create,
                    ),
                ),
        )
        .on(
            Events.InviteDelete,
            (invite) =>
                invite.channel &&
                !invite.channel.isDMBased() &&
                invokeLog("inviteDelete", invite.channel, () =>
                    embed("Invite Deleted", `discord.gg/${invite.code} to ${expand(invite.channel)} was deleted`, colors.actions.delete),
                ),
        )
        .on(
            Events.MessageDelete,
            (message) =>
                !message.channel.isDMBased() &&
                invokeLog("messageDelete", message.channel, async ({ filesOnly }) => {
                    if (filesOnly && message.attachments.size === 0 && message.stickers.size === 0) return;

                    const files = await copyMedia(message, SpoilerLevel.HIDE);

                    const outputs: MessageCreateOptions[] = [
                        {
                            embeds: [
                                {
                                    title: "Message Deleted",
                                    description: filesOnly ? "" : message.content ?? "",
                                    color: colors.actions.delete,
                                    fields: fieldsFor(message),
                                    url: message.url,
                                    footer:
                                        message.stickers.size > 0
                                            ? { text: `Sticker ID: ${message.stickers.map((sticker) => sticker.id).join(", ")}` }
                                            : undefined,
                                },
                            ],
                            files: files.slice(0, 10),
                        },
                    ];

                    if (files.length > 10)
                        outputs.push({
                            embeds: [
                                {
                                    title: "Additional Attachments",
                                    description: "Attachments from the above message could not fit in one message.",
                                    color: colors.actions.delete,
                                },
                            ],
                            files: files.slice(10),
                        });

                    return outputs;
                }),
        )
        .on(
            Events.MessageBulkDelete,
            (messages, channel) =>
                messages.size > 0 &&
                invokeLog("messageDeleteBulk", channel, async ({ filesOnly }) => {
                    const references: MessageCreateOptions[] = [];
                    const rows: string[] = [];

                    let index = 0;

                    for (const message of messages.toJSON().reverse()) {
                        const files = await copyMedia(message, SpoilerLevel.HIDE);

                        if (files.length > 0)
                            references.push({
                                embeds: [{ title: `Files for message ${++index}`, color: colors.actions.bulkDelete }],
                                files: files.slice(0, 10),
                            });

                        if (files.length > 10)
                            references.push({
                                embeds: [
                                    {
                                        title: `Additional files for message ${index}`,
                                        description: `Attachments from message ${index} could not fit in one message.`,
                                        color: colors.actions.bulkDelete,
                                    },
                                ],
                                files: files.slice(10),
                            });

                        let line: string;

                        if (filesOnly) {
                            if (files.length === 0) continue;
                            line = `${message.author} (${message.author?.tag}) [${index}]`;
                        } else
                            line = `${message.author} (${message.author?.tag})${files.length > 0 ? ` [${index}]` : ""}: ${escapeMarkdown(
                                message.content ?? "",
                            )}`;

                        rows.push(line.slice(0, 4096));
                        if (line.length > 4096) rows.push(line.slice(4096));
                    }

                    if (rows.length === 0) return;

                    const blocks = [rows.shift()!];

                    for (const row of rows) {
                        const next = `${blocks.at(-1)}\n${row}`;
                        if (next.length > 4096) blocks.push(row);
                        else blocks[blocks.length - 1] = next;
                    }

                    return [
                        ...blocks.map((block) => ({ embeds: [{ title: "Purged Messages", description: block, color: colors.actions.bulkDelete }] })),
                        ...references,
                    ];
                }),
        )
        .on(
            Events.MessageReactionAdd,
            (reaction, user) =>
                reaction.message.guild &&
                invokeLog("messageReactionAdd", reaction.message.guild, () => ({
                    embeds: [
                        {
                            title: "Reaction Added",
                            description: `${expand(user)} reacted ${reaction.emoji} to ${reaction.message.url} in ${expand(reaction.message.channel)}`,
                            color: colors.actions.create,
                            url: reaction.message.url,
                        },
                    ],
                })),
        )
        .on(
            Events.MessageReactionRemove,
            (reaction, user) =>
                !reaction.message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", reaction.message.channel, () => ({
                    embeds: [
                        {
                            title: "Reaction Removed",
                            description: `${expand(user)}'s reaction of ${reaction.emoji} to ${reaction.message.url} in ${expand(
                                reaction.message.channel,
                            )} was removed`,
                            color: colors.actions.delete,
                            url: reaction.message.url,
                        },
                    ],
                })),
        )
        .on(
            Events.MessageReactionRemoveAll,
            (message, reactions) =>
                !message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", message.channel, () => ({
                    embeds: [
                        {
                            title: "All Reactions Purged",
                            description: `all reactions on ${message.url} in ${expand(message.channel)} were purged: ${reactions
                                .map((x) => x.emoji)
                                .join(" ")}`,
                            color: colors.actions.delete,
                            url: message.url,
                        },
                    ],
                })),
        )
        .on(
            Events.MessageReactionRemoveEmoji,
            (reaction) =>
                !reaction.message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", reaction.message.channel, () => ({
                    embeds: [
                        {
                            title: "Reaction Emoji Purged",
                            description: `the reaction ${reaction.emoji} on ${reaction.message.url} in ${expand(reaction.message.channel)} was removed`,
                            color: colors.actions.bulkDelete,
                            url: reaction.message.url,
                        },
                    ],
                })),
        )
        .on(
            Events.MessageUpdate,
            (before, after) =>
                !before.flags.has(MessageFlags.Loading) &&
                !before.channel.isDMBased() &&
                !after.channel.isDMBased() &&
                invokeLog("messageUpdate", after.channel, ({ filesOnly }) => {
                    if ((filesOnly || (before.content ?? "") === (after.content ?? "")) && before.attachments.size === after.attachments.size) return;

                    const files = copyFiles(before.attachments.filter((attachment) => !after.attachments.has(attachment.id)).toJSON(), SpoilerLevel.HIDE);
                    const long = (before.content?.length ?? 0) > 1024 || (after.content?.length ?? 0) > 1024;

                    const embeds: APIEmbed[] = [
                        {
                            title: "Message Updated",
                            description:
                                files.length === 0 ? "" : `${files.length === 1 ? "An attachment was" : "Attachments were"} removed from this message.`,
                            color: colors.actions.update,
                            fields: [
                                fieldsFor(after),
                                filesOnly || long || before.content === after.content
                                    ? []
                                    : [
                                          before.content ? { name: "Before", value: before.content } : [],
                                          after.content ? { name: "After", value: after.content } : [],
                                      ].flat(),
                            ].flat(),
                            url: after.url,
                        },
                        !filesOnly && long && before.content !== after.content
                            ? [
                                  { title: "Before", description: before.content ?? "", color: colors.actions.update },
                                  { title: "After", description: after.content ?? "", color: colors.actions.update },
                              ]
                            : [],
                    ].flat();

                    const length = embeds
                        .map(
                            (e) =>
                                (e.title?.length ?? 0) +
                                (e.description?.length ?? 0) +
                                (e.fields ?? []).map((f) => f.name.length + f.value.length).reduce((x, y) => x + y, 0),
                        )
                        .reduce((x, y) => x + y);

                    return length > 6000 ? [{ embeds: [embeds.shift()!], files }, ...embeds.map((embed) => ({ embeds: [embed] }))] : { embeds, files };
                }),
        )
        .on(Events.GuildRoleCreate, (role) =>
            invokeLog("roleCreate", role.guild, async () => {
                const user = await audit(role.guild, AuditLogEvent.RoleCreate, role);
                const perms = role.permissions.toArray();

                return embed(
                    "Role Created",
                    `${expand(user, "System")} created ${expand(role)} with permission${perms.length === 1 ? "" : "s"} ${englishList(
                        perms.map((key) => permissions[key]?.name ?? key),
                    )}`,
                    colors.actions.create,
                );
            }),
        )
        .on(Events.GuildRoleDelete, (role) =>
            invokeLog("roleDelete", role.guild, async () => {
                const user = await audit(role.guild, AuditLogEvent.RoleDelete, role);
                const perms = role.permissions.toArray();

                return embed(
                    "Role Created",
                    `${expand(user, "System")} deleted ${role.name} (\`${role.id}\`) with permission${perms.length === 1 ? "" : "s"} ${englishList(
                        perms.map((key) => permissions[key]?.name ?? key),
                    )}`,
                    colors.actions.delete,
                );
            }),
        )
        .on(Events.GuildRoleUpdate, (before, after) =>
            invokeLog("roleUpdate", after.guild, async () => {
                const user = await audit(after.guild, AuditLogEvent.RoleUpdate, after);

                const rows: string[] = [];
                let thumbnail: { url: string } | undefined;

                if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);
                if (before.color !== after.color) rows.push(`- color: ${code(before.hexColor)} ${to} ${code(after.hexColor)}`);

                if (before.hoist && !after.hoist) rows.push(`- role no longer appears separately on the member list (unhoisted)`);
                else if (!before.hoist && after.hoist) rows.push(`- role now appears separately on the member list (hoisted)`);

                if (before.mentionable && !after.mentionable) rows.push(`- role is no longer able to be pinged by everyone`);
                else if (!before.mentionable && after.mentionable) rows.push(`- role is now able to be pinged by everyone`);

                const afterIcon = after.iconURL();

                if (before.iconURL() !== afterIcon) {
                    if (afterIcon) {
                        rows.push(`- role icon changed to ${afterIcon}`);
                        thumbnail = { url: afterIcon! };
                    } else rows.push(`- role icon removed`);
                }

                if (!before.permissions.equals(after.permissions)) {
                    const beforePerms = before.permissions.toArray();
                    const afterPerms = after.permissions.toArray();

                    const added = afterPerms.filter((x) => !beforePerms.includes(x));
                    const removed = beforePerms.filter((x) => !afterPerms.includes(x));

                    rows.push(
                        `- permissions have been changed:\n\`\`\`diff\n${[
                            ...added.map((x) => `+ ${permissions[x]?.name ?? x}`),
                            ...removed.map((x) => `- ${permissions[x]?.name ?? x}`),
                        ].join("\n")}\n\`\`\``,
                    );
                }

                if (rows.length === 0) return;

                return {
                    embeds: [
                        {
                            title: "Role Updated",
                            description: `${expand(user, "System")} updated ${expand(after)}\n\n${rows.join("\n")}`,
                            color: colors.actions.update,
                            thumbnail,
                        },
                    ],
                };
            }),
        )
        .on(
            Events.GuildStickerCreate,
            (sticker) =>
                sticker.guild &&
                invokeLog("stickerCreate", sticker.guild, async () => {
                    const user = await audit(sticker.guild!, AuditLogEvent.StickerCreate, sticker);
                    const url = await stickerCache.fetch(sticker);

                    return {
                        embeds: [
                            {
                                title: "Sticker Created",
                                description: `${expand(user, "Unknown User")} created ${sticker.name} (\`${sticker.id}\`)`,
                                color: colors.actions.create,
                            },
                        ],
                        files: url ? [{ attachment: url }] : [],
                    };
                }),
        )
        .on(
            Events.GuildStickerDelete,
            (sticker) =>
                sticker.guild &&
                invokeLog("stickerDelete", sticker.guild, async () => {
                    const user = await audit(sticker.guild!, AuditLogEvent.StickerDelete, sticker);
                    const url = await stickerCache.fetch(sticker);

                    return {
                        embeds: [
                            {
                                title: "Sticker Deleted",
                                description: `${expand(user, "Unknown User")} deleted ${sticker.name} (\`${sticker.id}\`)`,
                                color: colors.actions.delete,
                            },
                        ],
                        files: url ? [{ attachment: url }] : [],
                    };
                }),
        )
        .on(
            Events.GuildStickerUpdate,
            (before, after) =>
                before.guild &&
                after.guild &&
                invokeLog("stickerUpdate", after.guild, async () => {
                    if (before.name === after.name && before.description === after.description) return;

                    const user = await audit(after.guild!, AuditLogEvent.StickerUpdate, after);
                    const url = await stickerCache.fetch(after);

                    return {
                        embeds: [
                            {
                                title: "Sticker Updated",
                                description: `${expand(user, "Unknown User")} updated ${after.name} (\`${after.id}\`)\n${
                                    before.name === after.name ? "" : `\n- name: ${code(before.name)} ${to} ${code(after.name)}`
                                }${
                                    before.description === after.description
                                        ? ""
                                        : `\n- description: ${before.description ? code(before.description) : "(none)"} ${to} ${
                                              after.description ? code(after.description) : "(none)"
                                          }`
                                }`,
                                color: colors.actions.update,
                            },
                        ],
                        files: url ? [{ attachment: url }] : [],
                    };
                }),
        )
        .on(
            Events.ThreadCreate,
            (thread) =>
                thread.parent &&
                invokeLog("threadCreate", thread.parent, async () => {
                    const user = await audit(thread.guild, AuditLogEvent.ThreadCreate, thread);
                    const forum = thread.parent!.type === ChannelType.GuildForum;

                    return embed(
                        forum ? "Forum Post Created" : "Thread Created",
                        `${expand(user, "System")} created ${expand(thread)}${
                            forum ? "" : ` (${thread.type === ChannelType.PublicThread ? "public" : "private"})`
                        }`,
                        colors.actions.create,
                    );
                }),
        )
        .on(
            Events.ThreadDelete,
            (thread) =>
                thread.parent &&
                invokeLog("threadDelete", thread.parent, async () => {
                    const user = await audit(thread.guild, AuditLogEvent.ThreadDelete, thread);
                    const forum = thread.parent!.type === ChannelType.GuildForum;

                    return embed(
                        forum ? "Forum Post Deleted" : "Thread Deleted",
                        `${expand(user, "System")} deleted ${thread.name} (\`${thread.id}\`) in ${expand(thread.parent)}${
                            forum ? "" : ` (${thread.type === ChannelType.PublicThread ? "public" : "private"})`
                        }`,
                        colors.actions.delete,
                    );
                }),
        )
        .on(
            Events.ThreadUpdate,
            (before, after) =>
                before.parent &&
                after.parent &&
                invokeLog("threadUpdate", after.parent, async () => {
                    const user = await audit(after.guild, AuditLogEvent.ThreadUpdate, after);
                    const rows: string[] = [];

                    if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);

                    if (before.locked && !after.locked) rows.push(`- unlocked`);
                    else if (!before.locked && after.locked) rows.push(`- locked`);

                    if (before.archived && !after.archived) rows.push(`- unarchived`);
                    else if (!before.archived && after.archived) rows.push(`- archived`);

                    if (before.autoArchiveDuration !== after.autoArchiveDuration)
                        rows.push(
                            `- auto-archive duration: ${code(archiveDurations[before.autoArchiveDuration ?? 0])} ${to} ${code(
                                archiveDurations[after.autoArchiveDuration ?? 0],
                            )}`,
                        );

                    if (before.rateLimitPerUser !== after.rateLimitPerUser)
                        rows.push(
                            `- slowmode: ${formatDuration((before.rateLimitPerUser ?? 0) * 1000, DurationStyle.Blank)} ${to} ${formatDuration(
                                (after.rateLimitPerUser ?? 0) * 1000,
                                DurationStyle.Blank,
                            )}`,
                        );

                    if (rows.length === 0) return;

                    const forum = after.parent!.type === ChannelType.GuildForum;

                    return embed(
                        forum ? "Forum Post Updated" : "Thread Updated",
                        `${expand(user, "System")} updated ${expand(after)}${
                            forum ? "" : ` (${after.type === ChannelType.PublicThread ? "public" : "private"})`
                        }\n\n${rows.join("\n")}`,
                        colors.actions.update,
                    );
                }),
        )
        .on(Events.UserUpdate, (before, after) => {
            const beforeAvatar = before.displayAvatarURL({ size: 256 });
            const afterAvatar = after.displayAvatarURL({ size: 256 });

            if (beforeAvatar !== afterAvatar || before.username !== after.username) {
                const members = getAllClients().flatMap((client) => client.guilds.cache.map((guild) => guild.members.cache.get(after.id) ?? []).flat());
                if (members.length === 0) return;

                if (before.username !== after.username)
                    for (const member of members)
                        invokeLog("guildMemberUpdateName", member.guild, () =>
                            embed(
                                "Username Changed",
                                `${expand(after)} changed their username from ${code(before.username ?? "(unknown)")} to ${code(after.username)}`,
                                colors.actions.update,
                            ),
                        );

                if (beforeAvatar !== afterAvatar)
                    for (const member of members)
                        invokeLog("guildMemberUpdateAvatar", member.guild, () => ({
                            embeds: [
                                {
                                    title: "User Avatar Changed From...",
                                    description: expand(after),
                                    color: colors.actions.update,
                                    thumbnail: { url: beforeAvatar },
                                },
                                {
                                    title: "...To",
                                    color: colors.actions.update,
                                    thumbnail: { url: afterAvatar },
                                },
                            ],
                        }));
            }
        })
        .on(Events.VoiceStateUpdate, (before, after) =>
            before.channel
                ? after.channel
                    ? before.channelId === after.channelId
                        ? invokeLog("voiceStateUpdate", after.channel ?? after.guild, async () => {
                              const user = await audit(after.guild, AuditLogEvent.MemberUpdate, after.member);

                              const changes: string[] = [];

                              if (before.selfVideo !== after.selfVideo) changes.push(`turned their camera ${after.selfVideo ? "on" : "off"}`);
                              if (before.streaming !== after.streaming) changes.push(`${after.streaming ? "started" : "stopped"} streaming`);
                              if (before.selfMute !== after.selfMute) changes.push(`${after.selfMute ? "" : "un"}muted themselves`);
                              if (before.selfDeaf !== after.selfDeaf) changes.push(`${after.selfDeaf ? "" : "un"}deafened themselves`);

                              if (before.serverMute !== after.serverMute)
                                  changes.push(`was ${after.serverMute ? "suppressed" : "permitted to speak"} by ${expand(user)}`);

                              if (before.serverDeaf !== after.serverDeaf) changes.push(`was server-${after.serverDeaf ? "" : "un"}deafened by ${expand(user)}`);
                              if (before.suppress !== after.suppress) changes.push(`became ${after.suppress ? "an audience member" : "a speaker"}`);

                              if (changes.length === 0) return;

                              return embed("Voice State Updated", `${expand(after.member)} ${englishList(changes)}`, colors.actions.update);
                          })
                        : invokeLog("voiceMove", after.channel ?? after.guild, async () => {
                              const user = await audit(after.guild, AuditLogEvent.MemberMove);

                              return embed(
                                  "Voice Channel Changed",
                                  `${expand(after.member)} ${user ? "was (maybe) " : ""}moved from ${expand(before.channel)} to ${expand(after.channel)}${
                                      user ? ` by ${expand(user)}` : ""
                                  }`,
                                  colors.actions.update,
                              );
                          })
                    : invokeLog("voiceLeave", before.channel ?? before.guild, async () => {
                          const user = await audit(before.guild, AuditLogEvent.MemberDisconnect);

                          return embed(
                              "Voice Disconnect",
                              `${expand(before.member)} ${user ? "was (maybe) kicked from" : "left"} ${expand(before.channel)}${
                                  user ? ` by ${expand(user)}` : ""
                              }`,
                              colors.actions.delete,
                          );
                      })
                : invokeLog("voiceJoin", after.channel ?? after.guild, () =>
                      embed("Voice Connect", `${expand(after.member)} joined ${expand(after.channel)}`, colors.actions.create),
                  ),
        );
