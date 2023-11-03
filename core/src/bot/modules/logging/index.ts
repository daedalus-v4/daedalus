import Argentium from "argentium";
import { APIEmbed, AuditLogEvent, Events, Guild, GuildChannel, MessageCreateOptions, OverwriteType, PermissionsBitField, escapeMarkdown } from "discord.js";
import { SpoilerLevel, copyMedia } from "../../lib/copy-media.js";
import { DurationStyle, code, colors, embed, englishList, expand, formatDuration, timeinfo } from "../../lib/format.js";
import getMuteRole from "../../lib/get-mute-role.js";
import { invokeLog } from "../../lib/logging.js";
import { archiveDurations, audit, auditEntry, channelTypes, fieldsFor, statuses, to } from "./utils.js";

export default (app: Argentium) =>
    app
        .on(Events.ChannelCreate, async (channel) =>
            invokeLog("channelCreate", channel, async () => {
                const user = await audit(channel.guild, AuditLogEvent.ChannelCreate, channel);
                return embed("Channel Created", `${expand(user, "System")} created ${expand(channel)}`, colors.actions.create);
            }),
        )
        .on(
            Events.ChannelDelete,
            async (channel) =>
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
            async (before, after) =>
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
                                    `- default auto-archive duration: ${code(archiveDurations[before.defaultAutoArchiveDuration ?? 4320])} ${to} ${code(
                                        archiveDurations[after.defaultAutoArchiveDuration ?? 4320],
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
        .on(Events.GuildEmojiCreate, async (emoji) =>
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
        .on(Events.GuildEmojiDelete, async (emoji) =>
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
        .on(Events.GuildEmojiUpdate, async (before, after) =>
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
        .on(Events.GuildBanAdd, async (ban) =>
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
        .on(Events.GuildBanRemove, async (ban) =>
            invokeLog("guildBanRemove", ban.guild, async () => {
                const entry = await auditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user);

                return embed(
                    "User Unbanned",
                    `${expand(entry?.executor, "Unknown User")} unbanned ${expand(ban.user)}${entry?.reason ? ` with reason ${code(entry.reason)}` : ""}`,
                    colors.actions.create,
                );
            }),
        )
        .on(Events.GuildMemberAdd, async (member) =>
            invokeLog("guildMemberAdd", member.guild, async () =>
                embed(
                    "Member Joined",
                    `${expand(member)} just joined the server — account was created ${formatDuration(
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
                invokeLog("guildMemberKick", member.guild, async () =>
                    embed(
                        "Member Kicked",
                        `${expand(entry.executor, "Unknown User")} kicked ${expand(member)}${entry.reason ? ` with reason ${code(entry.reason)}` : ""}`,
                        colors.actions.delete,
                    ),
                );

            invokeLog("guildMemberRemove", member.guild, async () =>
                embed(
                    "Member Left",
                    `${expand(member)} just left the server — joined ${formatDuration(
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
                    invokeLog("guildMemberTimeout", after.guild, async () =>
                        embed(
                            "Member Timed Out",
                            `${expand(user, "System")} timed out ${expand(after)} until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                            colors.actions.delete,
                        ),
                    );
                else if ((after.communicationDisabledUntilTimestamp ?? 0) <= Date.now())
                    invokeLog("guildMemberTimeoutRemove", after.guild, async () =>
                        embed(
                            "Member Timeout Removed",
                            `${expand(user, "System")} removed the timeout for ${expand(after)} originally until ${timeinfo(
                                before.communicationDisabledUntil!,
                            )}${reason}`,
                            colors.actions.create,
                        ),
                    );
                else
                    invokeLog("guildMemberTimeout", after.guild, async () =>
                        embed(
                            "Member Timeout Duration Changed",
                            `${expand(user, "System")} changed the timeout for ${expand(after)} from until ${timeinfo(
                                before.communicationDisabledUntil!,
                            )} to until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                            colors.actions.update,
                        ),
                    );

            if (before.nickname !== after.nickname)
                invokeLog("guildMemberUpdateName", after.guild, async () =>
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
                invokeLog("guildMemberUpdateAvatar", after.guild, async () => ({
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

                invokeLog("guildMemberUpdateRoles", after.guild, async () =>
                    embed(
                        "Member Roles Update",
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
                        invokeLog("guildMemberMute", after.guild, async () =>
                            embed("Member Muted", `${expand(roleEditor, "Unknown User")} muted ${expand(after)}${reason}`, colors.actions.delete),
                        );
                    else if (mutedBefore && !mutedAfter)
                        invokeLog("guildMemberUnmute", after.guild, async () =>
                            embed("Member Unmuted", `${expand(roleEditor, "Unknown User")} unmuted ${expand(after)}${reason}`, colors.actions.create),
                        );
                }
            }
        })
        .on(
            Events.GuildScheduledEventCreate,
            (event) =>
                event.guild &&
                invokeLog("guildScheduledEventCreate", event.channel ?? event.guild, async () => ({
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
            async (before, after) =>
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
        .on(Events.GuildUpdate, async (before, after) =>
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
            async (invite) =>
                invite.channel &&
                !invite.channel.isDMBased() &&
                invokeLog("inviteCreate", invite.channel, async () =>
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
            async (invite) =>
                invite.channel &&
                !invite.channel.isDMBased() &&
                invokeLog("inviteDelete", invite.channel, async () =>
                    embed("Invite Deleted", `discord.gg/${invite.code} to ${expand(invite.channel)} was deleted`, colors.actions.delete),
                ),
        )
        .on(
            Events.MessageDelete,
            async (message) =>
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
            async (messages, channel) =>
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
            async (reaction, user) =>
                reaction.message.guild &&
                invokeLog("messageReactionAdd", reaction.message.guild, async () => ({
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
            async (reaction, user) =>
                !reaction.message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", reaction.message.channel, async () => ({
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
            async (message, reactions) =>
                !message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", message.channel, async () => ({
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
            async (reaction) =>
                !reaction.message.channel.isDMBased() &&
                invokeLog("messageReactionRemove", reaction.message.channel, async () => ({
                    embeds: [
                        {
                            title: "Reaction Emoji Purged",
                            description: `the reaction ${reaction.emoji} on ${reaction.message.url} in ${expand(reaction.message.channel)} was removed`,
                            color: colors.actions.bulkDelete,
                            url: reaction.message.url,
                        },
                    ],
                })),
        );
