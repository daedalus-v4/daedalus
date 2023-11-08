import Argentium from "argentium";
import { ButtonStyle, ChatInputCommandInteraction, ComponentType, GuildMember } from "discord.js";
import { DbUserHistory } from "shared";
import { autoIncrement, db, getColor, isCommandEnabled, isModuleEnabled } from "shared/db.js";
import { isStopped, stopButton } from "../../interactions/stop.js";
import confirm from "../../lib/confirm.js";
import { DurationStyle, colors, formatDuration, formatIdList, mdash, template, timeinfo } from "../../lib/format.js";
import { getMuteRoleWithAsserts } from "../../lib/get-mute-role.js";
import { defer } from "../../lib/hooks.js";
import { parseDuration } from "../../lib/parsing.js";
import { check, checkPunishment } from "../../lib/permissions.js";
import sendDm, { dmStatuses } from "../../lib/send-dm.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x
            .slash((x) =>
                x
                    .key("ban")
                    .description("ban a user from the server, even if they are not in the server")
                    .userOption("user", "the user to ban", { required: true })
                    .stringOption("reason", "the reason for banning (sent to the user + logged)", { maxLength: 512 })
                    .stringOption("duration", `the duration of the ban (default: forever)`)
                    .stringOption("purge", "the duration of chat history to purge from this user (default: 0, max: 7 days)")
                    .booleanOption("silent", "if true, the user will not be notified")
                    .booleanOption("force", "specify this to purge messages for a user who is already banned")
                    .fn(async ({ _, user, reason, duration: _duration, purge: _purge, silent, force }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        await checkPunishment(_, user, "ban");

                        reason ??= "";

                        const duration = _duration ? parseDuration(_duration) : Infinity;
                        const purge = _purge ? parseDuration(_purge) : 0;
                        if (purge > 604800000) throw "Purge duration cannot exceed 7 days.";

                        silent ??= false;
                        force ??= false;

                        if (!force)
                            try {
                                await _.guild.bans.fetch(user);

                                return template.error(
                                    "That user is already banned, so this action will not do anything. Specify `force: true` to unban and re-ban them.",
                                );
                            } catch {}

                        let inServer = true;

                        try {
                            await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            inServer = false;
                            silent = true;
                        }

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm ${inServer ? "" : "pre-"}banning ${user.tag} ${formatDuration(duration)}`,
                                        description: [
                                            inServer
                                                ? user.bot
                                                    ? "This user is a bot and therefore cannot be notified."
                                                    : `The user ${silent ? "will not" : "will"} be notified.`
                                                : "The user is not in the server and therefore will not be notified.",
                                        ]
                                            .filter((x) => x)
                                            .join(" "),
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        await checkPunishment(response, user, "ban");
                        const { banFooter } = (await db.guildSettings.findOne({ guild: _.guild.id })) ?? {};

                        let unban: Date | undefined;
                        if (duration !== Infinity) unban = new Date(Date.now() + duration);

                        const status = await sendDm(_, user, silent, {
                            embeds: [
                                {
                                    title: `You were __banned__ from **${_.guild.name}** ${formatDuration(duration)}`,
                                    description: unban ? `Your ban will automatically expire on ${timeinfo(unban)}.` : "",
                                    color: await getColor(_.guild),
                                    fields: [reason ? { name: "Reason", value: reason } : [], banFooter ? { name: "_ _", value: banFooter } : []].flat(),
                                },
                            ],
                        });

                        if (force) await _.guild.bans.remove(user, "forcing re-ban").catch(() => {});

                        await _.guild.bans.create(user, { deleteMessageSeconds: purge / 1000, reason });

                        const id = await autoIncrement(`history/${_.guild.id}`);

                        await db.userHistory.insertOne({
                            guild: _.guild.id,
                            user: user.id,
                            id,
                            type: "ban",
                            mod: _.user.id,
                            time: Date.now(),
                            duration,
                            origin: response.message.url,
                            reason,
                        });

                        if (unban)
                            await db.tasks.updateOne(
                                { action: "unban", guild: _.guild.id, user: user.id },
                                { $set: { time: unban.getTime() } },
                                { upsert: true },
                            );
                        else await db.tasks.deleteOne({ action: "unban", guild: _.guild.id, user: user.id });

                        await response.editReply({
                            embeds: [
                                {
                                    title: `${inServer ? "Banned" : "Pre-banned"} ${user.tag} ${formatDuration(duration)}`,
                                    description: `This is case #${id}. ${status}${
                                        unban ? ` This ban will automatically be removed on ${timeinfo(unban)}.` : ""
                                    }${purge ? ` ${formatDuration(purge, DurationStyle.Blank)} of messages were purged.` : ""}`,
                                    color: colors.statuses.success,
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    footer: { text: user.id },
                                },
                            ],
                            components: [],
                        });
                    }),
            )
            .slash((x) =>
                x
                    .key("kick")
                    .description("kick a member from the server")
                    .userOption("user", "the user to kick", { required: true })
                    .stringOption("reason", "the reason for kicking (sent to the user + logged)", { maxLength: 512 })
                    .booleanOption("silent", "if true, the user will not be notified")
                    .fn(async ({ _, user, reason, silent }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        await checkPunishment(_, user, "kick");

                        reason ??= "";
                        silent ??= false;

                        let member: GuildMember;

                        try {
                            member = await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            throw "You can only kick users who are in this server.";
                        }

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm kicking ${user.tag}`,
                                        description: user.bot
                                            ? "The user is a bot and therefore cannot be notified."
                                            : `The user ${silent ? "will not" : "will"} be notified.`,
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        await checkPunishment(response, user, "kick");

                        const status = await sendDm(_, user, silent, {
                            embeds: [
                                {
                                    title: `You were __kicked__ from **${_.guild.name}**`,
                                    color: await getColor(_.guild),
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                },
                            ],
                        });

                        await member.kick().catch(() => {});

                        const id = await autoIncrement(`history/${_.guild.id}`);

                        await db.userHistory.insertOne({
                            guild: _.guild.id,
                            user: user.id,
                            id,
                            type: "kick",
                            mod: _.user.id,
                            time: Date.now(),
                            origin: response.message.url,
                            reason,
                        });

                        await response.editReply({
                            embeds: [
                                {
                                    title: `Kicked ${user.tag}`,
                                    description: `This is case #${id}. ${status}`,
                                    color: colors.statuses.success,
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    footer: { text: user.id },
                                },
                            ],
                            components: [],
                        });
                    }),
            )
            .slash((x) =>
                x
                    .key("mute")
                    .description("mute a user by assigning them the mute role")
                    .userOption("user", "the user to mute", { required: true })
                    .stringOption("reason", "the reason for muting (sent to the user + logged)", { maxLength: 512 })
                    .stringOption("duration", "the duration of the mute (default: forever)")
                    .booleanOption("silent", "if true, the user will not be notified")
                    .fn(async ({ _, user, reason, duration: _duration, silent }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        await getMuteRoleWithAsserts(_.guild);
                        await checkPunishment(_, user, "mute");

                        reason ??= "";

                        const duration = _duration ? parseDuration(_duration) : Infinity;

                        silent ??= false;

                        let member: GuildMember | undefined;

                        try {
                            member = await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            if (!(await isModuleEnabled(_.guild.id, "sticky-roles")))
                                throw "That user is not in the server. Enable the Sticky Roles module to enable muting non-members.";
                        }

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm ${member ? "" : "pre-"}muting ${user.tag} ${formatDuration(duration)}`,
                                        description: member
                                            ? user.bot
                                                ? "This user is a bot and therefore cannot be notified."
                                                : `The user ${silent ? "will not" : "will"} be notified.`
                                            : "The user is not in the server and therefore will not be notified.",
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        await checkPunishment(response, user, "mute");
                        const role = await getMuteRoleWithAsserts(_.guild);

                        let unmute: Date | undefined;
                        if (duration !== Infinity) unmute = new Date(Date.now() + duration);

                        if (member) await member.roles.add(role, reason);
                        else if (await isModuleEnabled(_.guild.id, "sticky-roles"))
                            await db.stickyRoles.updateOne({ guild: _.guild.id, user: user.id }, { $addToSet: { roles: role.id } }, { upsert: true });
                        else throw "That user is not in the server. Enable the Sticky Roles module to enable muting non-members.";

                        const status = await sendDm(_, user, silent, {
                            embeds: [
                                {
                                    title: `You were __muted__ in **${_.guild.name}** ${formatDuration(duration)}`,
                                    description: unmute ? `Your mute will automatically expire on ${timeinfo(unmute)}.` : "",
                                    color: await getColor(_.guild),
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                },
                            ],
                        });

                        const id = await autoIncrement(`history/${_.guild.id}`);

                        await db.userHistory.insertOne({
                            guild: _.guild.id,
                            user: user.id,
                            id,
                            type: "mute",
                            mod: _.user.id,
                            time: Date.now(),
                            duration,
                            origin: response.message.url,
                            reason,
                        });

                        if (unmute)
                            await db.tasks.updateOne(
                                { action: "unmute", guild: _.guild.id, user: user.id },
                                { $set: { time: unmute.getTime() } },
                                { upsert: true },
                            );
                        else await db.tasks.deleteOne({ action: "unmute", guild: _.guild.id, user: user.id });

                        await response.editReply({
                            embeds: [
                                {
                                    title: `${member ? "Muted" : "Pre-muted"} ${user.tag} ${formatDuration(duration)}`,
                                    description: `This is case #${id}. ${status}${
                                        unmute ? ` This mute will automatically be removed on ${timeinfo(unmute)}.` : ""
                                    }`,
                                    color: colors.statuses.success,
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    footer: { text: user.id },
                                },
                            ],
                            components: [],
                        });
                    }),
            )
            .slash((x) =>
                x
                    .key("timeout")
                    .description("timeout a member or remove their timeout")
                    .userOption("user", "the user to timeout", { required: true })
                    .stringOption("reason", "the reason for timing out (sent to the user + logged)", { maxLength: 512 })
                    .stringOption("duration", "the duration of the timeout (default: 0s = remove)")
                    .booleanOption("silent", "if true, the user will not be notified")
                    .fn(async ({ _, user, reason, duration: _duration, silent }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        await checkPunishment(_, user, "timeout");

                        reason ??= "";

                        const duration = _duration ? parseDuration(_duration, false) : 0;
                        if (duration > 2419200000) throw "Timeout duration cannot exceed 28 days.";

                        silent ??= false;

                        let member: GuildMember;

                        try {
                            member = await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            throw `You can only ${duration > 0 ? "timeout" : "remove the timeout for"} users who are in this server.`;
                        }

                        if (duration === 0 && !member.isCommunicationDisabled()) throw `${member} is not currently timed out.`;

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: duration
                                            ? `Confirm timing out ${user.tag} for ${formatDuration(duration)}`
                                            : `Confirm removing ${user.tag}'s timeout`,
                                        description: user.bot
                                            ? "The user is a bot and therefore cannot be notified."
                                            : `The user ${silent ? "will not" : "will"} be notified.`,
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        await checkPunishment(response, user, "timeout");

                        if (duration) {
                            const until = new Date(Date.now() + duration);
                            await member.disableCommunicationUntil(until, reason);

                            const status = await sendDm(_, user, silent, {
                                embeds: [
                                    {
                                        title: `You were __timed out__ in **${_.guild.name}** ${formatDuration(duration)}`,
                                        description: `Your timeout will automatically expire on ${timeinfo(until)}.`,
                                        color: await getColor(_.guild),
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    },
                                ],
                            });

                            const id = await autoIncrement(`history/${_.guild.id}`);

                            await db.userHistory.insertOne({
                                guild: _.guild.id,
                                user: user.id,
                                id,
                                type: "timeout",
                                mod: _.user.id,
                                time: Date.now(),
                                duration,
                                origin: response.message.url,
                                reason,
                            });

                            await response.editReply({
                                embeds: [
                                    {
                                        title: `Timed out ${user.tag} ${formatDuration(duration)}`,
                                        description: `This is case #${id}. ${status} This timeout will automatically be removed on ${timeinfo(until)}.`,
                                        color: colors.statuses.success,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                                components: [],
                            });
                        } else {
                            await member.disableCommunicationUntil(null, reason);

                            const status = await sendDm(_, user, silent, {
                                embeds: [
                                    {
                                        title: `Your timeout in **${_.guild.name}** was removed.`,
                                        description: "You are able to interact again.",
                                        color: await getColor(_.guild),
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    },
                                ],
                            });

                            await response.editReply({
                                embeds: [
                                    {
                                        title: `Remvoed ${user.tag}'s timeout`,
                                        description: status,
                                        color: colors.statuses.success,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                                components: [],
                            });
                        }
                    }),
            )
            .slash((x) =>
                x
                    .key("warn")
                    .description("send a DM warning to a member")
                    .userOption("user", "the user to warn", { required: true })
                    .stringOption("reason", "the reason for warning (sent to the user + logged)", { required: true, maxLength: 512 })
                    .booleanOption("informal", "if true, the warning will be marked as informal to the user and in their user history")
                    .booleanOption("silent", "if true, the user will not receive a notification")
                    .fn(async ({ _, user, reason, informal, silent }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";
                        if (user.bot) throw "You cannot warn bots, as bots cannot DM each other. If you want to keep notes on bots, use the notes feature.";

                        await checkPunishment(_, user, "warn");

                        silent ??= false;
                        informal ??= false;

                        let member: GuildMember | undefined;

                        try {
                            member = await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            if (!silent)
                                throw "You can only warn users who are in the server. Enable `silent` to add warnings to a non-member without notifying them.";
                        }

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm ${informal ? "in" : ""}formally warning ${user.tag}`,
                                        description: silent ? "The user will not be notifieds." : "The user will be DM'd your warning.",
                                        color: colors.prompts.confirm,
                                        fields: [{ name: "Reason", value: reason }],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        if (member) await checkPunishment(response, member, "warn");

                        const status = await sendDm(_, user, silent, {
                            embeds: [
                                {
                                    title: `You were ${informal ? "in" : ""}formally __warned__ in **${_.guild.name}**`,
                                    color: await getColor(_.guild),
                                    fields: [{ name: "Reason", value: reason }],
                                },
                            ],
                        });

                        if (status === dmStatuses.failed) {
                            await response.editReply(template.error(status));
                            return;
                        }

                        const id = await autoIncrement(`history/${_.guild.id}`);

                        await db.userHistory.insertOne({
                            guild: _.guild.id,
                            user: user.id,
                            id,
                            type: `${informal ? "informal_" : ""}warn`,
                            mod: _.user.id,
                            time: Date.now(),
                            origin: response.message.url,
                            reason,
                        });

                        await response.editReply({
                            embeds: [
                                {
                                    title: `Warned ${user.tag} ${informal ? "in" : ""}formally`,
                                    description: `This is case #${id}. ${status}`,
                                    color: colors.statuses.success,
                                    fields: [{ name: "Reason", value: reason }],
                                    footer: { text: user.id },
                                },
                            ],
                            components: [],
                        });
                    }),
            )
            .slash((x) =>
                x
                    .key("unban")
                    .description("unban a user, allowing them to join the server again")
                    .userOption("user", "the user to unban", { required: true })
                    .stringOption("reason", "the reason for unbanning (audit logged)")
                    .fn(async ({ _, user, reason }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm unbanning ${user.tag}`,
                                        description: "The user will not be notified.",
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();

                        try {
                            await _.guild.bans.remove(user, reason ?? undefined);
                            await db.tasks.deleteOne({ action: "unban", guild: _.guild.id, user: user.id });

                            await response.editReply({
                                embeds: [
                                    {
                                        title: `Unbanned ${user.tag}`,
                                        color: colors.statuses.success,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    },
                                ],
                                components: [],
                            });
                        } catch {
                            await response.editReply(template.error(`${user} is not currently banned.`));
                        }
                    }),
            )
            .slash((x) =>
                x
                    .key("unmute")
                    .description("unmute a user by removing the mute role from them")
                    .userOption("user", "the user to unmute", { required: true })
                    .stringOption("reason", "the reason for unmuting (sent to the user + audit logged)")
                    .booleanOption("silent", "if true, the user will not be notified")
                    .fn(async ({ _, user, reason, silent }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        silent ??= false;

                        await getMuteRoleWithAsserts(_.guild);

                        let member: GuildMember | undefined;

                        try {
                            member = await _.guild.members.fetch({ user: user.id, force: true });
                        } catch {
                            if (!(await isModuleEnabled(_.guild.id, "sticky-roles")))
                                throw "That user is not in the server. Enable the Sticky Roles module to enable unmuting non-members.";
                        }

                        const response = await confirm(
                            _,
                            {
                                embeds: [
                                    {
                                        title: `Confirm unmuting ${user.tag}`,
                                        description: `The user ${silent ? "will not" : "will"} be notified.`,
                                        color: colors.prompts.confirm,
                                        fields: reason ? [{ name: "Reason", value: reason }] : [],
                                        footer: { text: user.id },
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        await response.deferUpdate();
                        const role = await getMuteRoleWithAsserts(_.guild);

                        if (member) await member.roles.remove(role, reason ?? undefined);
                        else if (await isModuleEnabled(_.guild.id, "sticky-roles"))
                            await db.stickyRoles.updateOne({ guild: _.guild.id, user: user.id }, { $pull: { roles: role.id } }, { upsert: true });
                        else throw "That user is not in the server. Enable the Sticky Roles module to enable unmuting non-members.";

                        const status = await sendDm(_, user, silent, {
                            embeds: [
                                {
                                    title: `You were unmuted in **${_.guild.name}**`,
                                    description: "You are able to interact again.",
                                    color: await getColor(_.guild),
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                },
                            ],
                        });

                        await db.tasks.deleteOne({ action: "unmute", guild: _.guild.id, user: user.id });

                        await response.editReply({
                            embeds: [
                                {
                                    title: `Unmuted ${user.tag}`,
                                    description: status,
                                    color: colors.statuses.success,
                                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                                    footer: { text: user.id },
                                },
                            ],
                            components: [],
                        });
                    }),
            )
            .slash((x) =>
                x
                    .key("massban list")
                    .description("ban many users at once by pasting the list of IDs into the command directly")
                    .stringOption("users", "the list of user IDs", { required: true })
                    .use(addReasonAndPurge)
                    .fn(({ _, users, reason, purge }) => massban(_, users, reason, purge)),
            )
            .slash((x) =>
                x
                    .key("massban url")
                    .description("ban many users at once from a URL (accepts raw text files)")
                    .stringOption("url", "the URL pointing to the file of user IDs", { required: true })
                    .use(addReasonAndPurge)
                    .fn(({ _, url, reason, purge }) => massbanURL(_, url, reason, purge)),
            )
            .slash((x) =>
                x
                    .key("massban file")
                    .description("ban many users at once from a file upload")
                    .fileOption("file", "the file of user IDs", { required: true })
                    .use(addReasonAndPurge)
                    .fn(({ _, file, reason, purge }) => massbanURL(_, file.url, reason, purge)),
            )
            .slash((x) =>
                x
                    .key("history")
                    .description("view a user's history")
                    .userOption("user", "the user to check", { required: true })
                    .fn(defer(false))
                    .fn(async ({ _, user }) => {
                        if (!_.guild) throw "This command can only be run in a guild.";

                        const entries = await db.userHistory.find({ guild: _.guild.id, user: user.id }).toArray();
                        const { notes } = (await db.userNotes.findOne({ guild: _.guild.id, user: user.id })) ?? {};

                        const components =
                            notes &&
                            (await isModuleEnabled(_.guild.id, "moderation")) &&
                            (await isCommandEnabled(_.guild.id, "notes")) &&
                            !(await check(_.user, "notes", _.channel!))
                                ? [
                                      {
                                          type: ComponentType.ActionRow,
                                          components: [
                                              {
                                                  type: ComponentType.Button,
                                                  style: ButtonStyle.Secondary,
                                                  customId: `:${_.user.id}:notes/show:${user.id}`,
                                                  label: "Show user's mod notes",
                                              },
                                          ],
                                      },
                                  ]
                                : [];

                        const messages = [];

                        let first = true;

                        while (first || entries.length > 0) {
                            first = false;

                            messages.push({
                                embeds: [
                                    entries.length === 0
                                        ? {
                                              title: `${user.tag}'s History`,
                                              description: `${user}'s history is clean.`,
                                              color: await getColor(_.guild),
                                          }
                                        : {
                                              title: `${user.tag}'s History`,
                                              color: await getColor(_.guild),
                                              fields: await Promise.all(
                                                  entries.splice(0, 5).map(async (entry) => ({
                                                      name: `**${historyActionStrings[entry.type]}** #${entry.id}`,
                                                      value: `**${historyVerbs[entry.type]} by <@${entry.mod}> at ${timeinfo(entry.time)}${
                                                          ["warn", "informal_warn", "kick"].includes(entry.type) || entry.duration === undefined
                                                              ? ""
                                                              : ` ${formatDuration(entry.duration)}${entry.origin ? ` [here](${entry.origin})}` : ""}`
                                                      }**${entry.reason ? `\n\n**Reason:** ${entry.reason}` : " (no reason provided)"}`,
                                                  })),
                                              ),
                                          },
                                ],
                                components,
                            });
                        }
                    }),
            ),
    );

const addReasonAndPurge = <T>(x: SlashUtil<T>) =>
    x
        .stringOption("reason", "the reason for banning (logged, but not sent to the users)", { maxLength: 512 })
        .stringOption("purge", "the duration of chat history to purge from all banned users (default: 0, max: 7 days)");

async function massbanURL(_: ChatInputCommandInteraction, url: string, reason: string | null, _purge: string | null) {
    if (!_.guild) throw "This command can only be run in a guild.";

    const response = await fetch(url).catch(() => {
        throw "Invalid URL.";
    });

    if (!response.ok) throw `The URL could not be fetched (status code \`${response.status} ${mdash} ${response.statusText}\`).`;

    return await massban(_, (await response.text()).trim(), reason, _purge);
}

async function massban(_: ChatInputCommandInteraction, idlist: string, reason: string | null, _purge: string | null) {
    if (!_.guild) throw "This command can only be run in a guild.";

    const purge = _purge ? parseDuration(_purge) : 0;
    if (purge > 604800000) throw "Purge duration cannot exceed 7 days.";

    if (!idlist.match(/^\d+([,\s]+\d+)*$/)) throw "Invalid format; expected a whitespace/comma-separated list of user IDs (17-20 digit numbers).";

    const ids = [...new Set([...idlist.matchAll(/\d+/g)].map((x) => x[0]))];

    const invalid = ids.find((x) => x.startsWith("0") || x.length < 17 || x.length > 20);
    if (invalid) throw `Invalid ID \`${invalid}\` ${mdash} IDs should be 17-20 digit numbers.`;

    const response = await confirm(
        _,
        {
            embeds: [
                {
                    title: `Confirm massbanning ${ids.length} user${ids.length === 1 ? "" : "s"}`,
                    description: [
                        "No users will be notified, and any users who you or the bot cannot ban will be ignored.",
                        purge ? `${formatDuration(purge, DurationStyle.Blank)} of messages will be purged.` : "",
                    ]
                        .filter((x) => x)
                        .join(" "),
                    color: colors.prompts.confirm,
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
        },
        300000,
    );

    if (!response) return;

    await response.update({
        ...template.progress("Massbanning in progress. Please be patient."),
        components: [{ type: ComponentType.ActionRow, components: [stopButton(_.user)] }],
    });

    const success: string[] = [];
    const historyEntries: DbUserHistory[] = [];

    try {
        for (const id of ids) {
            if (isStopped(response.message.id)) {
                await response.message.edit({
                    ...template.info(
                        `Massbanning was halted. ${success.length} user${success.length === 1 ? " was" : "s were"} already banned. Their ID${
                            success.length === 1 ? " is" : "s are"
                        } shown above.`,
                    ),
                    files: [{ name: "ids.txt", description: "users that were already banned", attachment: Buffer.from(formatIdList(success)) }],
                });

                return;
            }

            try {
                const user = await _.client.users.fetch(id);
                await checkPunishment(_, user, "ban");
                await _.guild.bans.create(user, { deleteMessageSeconds: purge / 1000, reason: reason ?? undefined });
                const historyId = await autoIncrement(`history/${_.guild.id}`);

                historyEntries.push({
                    guild: _.guild.id,
                    user: user.id,
                    id: historyId,
                    type: "ban",
                    mod: _.user.id,
                    time: Date.now(),
                    duration: Infinity,
                    origin: response.message.url,
                    reason,
                });

                success.push(id);
            } catch {}
        }

        await response.message.edit({
            embeds: [
                {
                    title: "Success",
                    description: `Massbanned ${success.length} user${
                        success.length === 1 ? "" : "s"
                    } (this list may include users who were already banned previously). No users were DM'd.${
                        purge ? ` ${formatDuration(purge, DurationStyle.Blank)} of messages were purged.` : ""
                    }`,
                    color: colors.statuses.success,
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
            components: [],
        });
    } finally {
        if (historyEntries.length > 0) await db.userHistory.insertMany(historyEntries);
    }
}

const historyActionStrings = {
    warn: "Warn",
    informal_warn: "Informal Warn",
    mute: "Mute",
    timeout: "Timeout",
    kick: "Kick",
    ban: "Ban",
    massban: "Massban",
    bulk: "Bulk Action",
} as Record<string, string>;

const historyVerbs = {
    warn: "Warned",
    informal_warn: "Informally Warned",
    mute: "Muted",
    timeout: "Timed out",
    kick: "Kicked",
    ban: "Banned",
    massban: "Massbanned",
    bulk: "Multiple Actions Taken",
} as Record<string, string>;
