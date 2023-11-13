import Argentium from "argentium";
import { Events, Message, PartialMessage, PermissionFlagsBits } from "discord.js";
import { formatDuration } from "shared";
import { autoIncrement, db, getLimitFor } from "shared/db.js";
import { englishList, expand } from "../../lib/format.js";
import { getMuteRoleWithAsserts } from "../../lib/get-mute-role.js";
import { skip } from "../utils.js";
import { AutomodRule, match, skipScan } from "./lib.js";

export default (app: Argentium) => app.on(Events.MessageCreate, scan).on(Events.MessageUpdate, (_, message) => scan(message));

async function scan(message: Message | PartialMessage) {
    if (!message.guild) return;
    if (message.author?.id === message.client.user.id) return;
    // if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (await skip(message.guild, "automod")) return;

    try {
        if (message.webhookId && (await message.fetchWebhook()).isChannelFollower()) return;
    } catch {}

    const settings = await db.automodSettings.findOne({ guild: message.guild.id });
    if (!settings) return;

    const actionDurations: Partial<Record<AutomodRule["additionalAction"], number>> = {};
    const reports = new Map<string, { rule: AutomodRule; report: string; notified: boolean }[]>();
    const notifs: string[] = [];

    let willDelete = false,
        willNotify = false,
        caught = false;

    const multiDeleteTargets: Message[] = [];

    let fetched: Message;
    if (!message.partial) fetched = message;

    for (const rule of settings.rules.slice(0, await getLimitFor(message.guild, "automodCount"))) {
        if (skipScan(message, rule, settings)) continue;
        fetched ??= await message.fetch();

        const result = await match(rule, fetched, multiDeleteTargets);
        if (!result) continue;

        const [notif, report] = result;

        caught = true;
        actionDurations[rule.additionalAction] = Math.max(actionDurations[rule.additionalAction] ?? 0, rule.actionDuration || Infinity);
        notifs.push(notif.trim());

        willDelete ||= rule.deleteMessage;
        willNotify ||= rule.notifyAuthor;

        if (rule.reportToChannel) {
            const key = rule.reportChannel || settings.defaultChannel;

            if (key) {
                if (!reports.has(key)) reports.set(key, []);
                reports.get(key)!.push({ rule, report, notified: rule.notifyAuthor });
            }
        }
    }

    if (!caught) return;

    if (multiDeleteTargets.length > 0) {
        const groups = new Map<string, Message[]>();

        for (const target of multiDeleteTargets) {
            if (!groups.has(target.channel.id)) groups.set(message.channel.id, []);
            groups.get(message.channel.id)!.push(target);
        }

        for (const [channelId, messageList] of groups) {
            try {
                if (messageList.length === 1) messageList[0].delete();
                else {
                    const channel = await message.guild.channels.fetch(channelId);
                    if (channel?.isTextBased() && !channel.isDMBased()) await channel.bulkDelete(messageList);
                }
            } catch {}
        }
    }

    if (willDelete && !multiDeleteTargets.some((x) => x.id === message.id)) message.delete();

    const actions: Exclude<AutomodRule["additionalAction"], "nothing">[] = [];

    if (actionDurations.timeout !== undefined && actionDurations.mute !== undefined)
        actions.push(actionDurations.mute > actionDurations.timeout ? "mute" : "timeout");
    else if (actionDurations.timeout !== undefined) actions.push("timeout");
    else if (actionDurations.mute !== undefined) actions.push("mute");

    if (actionDurations.ban !== undefined) {
        actions.push("ban");

        for (const key of ["mute", "timeout"] as const)
            if (
                actionDurations.ban === Infinity ||
                (actions.includes(key) && actionDurations[key] !== Infinity && actionDurations.ban >= actionDurations[key]!)
            )
                actions.splice(actions.indexOf(key), 1);
    } else if (actionDurations.kick !== undefined) actions.push("kick");

    if (actions.length === 0 && actionDurations.warn !== undefined) actions.push("warn");

    const actionString = englishList(
        actions.map((x) => `${past[x]}${["mute", "timeout", "ban"].includes(x) ? ` ${formatDuration(actionDurations[x]!)}` : ""}`),
    );

    let notified = false;
    let report: Message | undefined;

    const { banFooter, embedColor } = (await db.guildSettings.findOne({ guild: message.guild.id })) ?? {};

    if (willNotify && !message.author?.bot) {
        try {
            await message.author?.send({
                embeds: [
                    {
                        title: "Automod Action Taken",
                        description: `Your message was deleted by automod. ${
                            actions.length > 0
                                ? actionString === past.warn
                                    ? "This is a formal (logged) warning."
                                    : `As a result, you were ${actionString}.`
                                : "No further action was taken; this is just an (unlogged) notice."
                        }\n\n**Details:**\n${notifs.join(" ")}`.slice(0, 4096),
                        color: embedColor ?? 0x009688,
                        footer: { text: willDelete ? "Your message was deleted." : "" },
                    },
                    ...(banFooter ? [{ description: banFooter, color: embedColor }] : []),
                ],
            });

            notified = true;
        } catch {}
    }

    for (const [channelId, data] of reports)
        try {
            const channel = await message.guild.channels.fetch(channelId);
            if (!channel?.isTextBased()) continue;

            report = await channel.send({
                embeds: [
                    {
                        title: "Automod Action Taken",
                        description: `${expand(message.author)} triggered the ${englishList(data.map((item) => item.rule.name))} rule${
                            data.length === 1 ? "" : "s"
                        }${
                            actions.length > 0
                                ? ` and was ${actionString}`
                                : willNotify
                                  ? notified
                                      ? " and was notified (but no history was logged)"
                                      : " but could not be notified"
                                  : ""
                        }.`,
                        color: embedColor,
                        fields: [
                            {
                                name: "Details",
                                value: data
                                    .map((item) => item.report)
                                    .join(" ")
                                    .slice(0, 1024),
                            },
                        ],
                        footer: {
                            text: [
                                willNotify
                                    ? notified
                                        ? "The user was notified of this action."
                                        : message.author?.bot
                                          ? "The message was sent by a bot so no notification could be sent."
                                          : "The user could not be notified; they may have DMs closed or may have blocked the bot."
                                    : [],
                                willDelete ? "The message was deleted." : [],
                            ]
                                .flat()
                                .join(" "),
                        },
                        url: message.url,
                    },
                ],
            });
        } catch {}

    if (!message.webhookId)
        try {
            if (actions.includes("mute")) {
                try {
                    const muteRole = await getMuteRoleWithAsserts(message.guild);
                    await message.member?.roles.add(muteRole, "Automod Action");
                } catch {}

                if (actionDurations.mute === 0) await db.tasks.deleteOne({ action: "unmute", guild: message.guild.id, user: message.author!.id });
                else
                    await db.tasks.updateOne(
                        { action: "unmute", guild: message.guild.id, user: message.author!.id },
                        { $set: { time: Date.now() + actionDurations.mute! } },
                        { upsert: true },
                    );
            }

            if (actions.includes("timeout") && message.member?.moderatable)
                message.member.disableCommunicationUntil(Date.now() + actionDurations.timeout!, "Automod Action");

            if (actions.includes("kick") && message.member?.kickable) message.member.kick("Automod Action");

            if (actions.includes("ban") && message.member?.bannable) {
                message.member.ban({ reason: "Automod Action" });

                if (actionDurations.ban === 0) await db.tasks.deleteOne({ action: "unban", guild: message.guild.id, user: message.author!.id });
                else
                    await db.tasks.updateOne(
                        { action: "unban", guild: message.guild.id, user: message.author!.id },
                        { $set: { time: Date.now() + actionDurations.ban! } },
                        { upsert: true },
                    );
            }

            if (actions.length === 1)
                await db.userHistory.insertOne({
                    guild: message.guild.id,
                    user: message.author!.id,
                    id: await autoIncrement(`history/${message.guild.id}`),
                    type: actions[0],
                    mod: message.client.user.id,
                    time: Date.now(),
                    duration: ["mute", "timeout", "ban"].includes(actions[0]) ? actionDurations[actions[0]] || Infinity : undefined,
                    origin: report?.url,
                    reason: "Automod Action",
                });
            else if (actions.length > 1)
                await db.userHistory.insertOne({
                    guild: message.guild.id,
                    user: message.author!.id,
                    id: await autoIncrement(`history/${message.guild.id}`),
                    type: "bulk",
                    mod: message.client.user.id,
                    time: Date.now(),
                    duration:
                        actions
                            .filter((x) => ["mute", "timeout", "ban"].includes(x))
                            .map((x) => actionDurations[x])
                            .reduce((x, y) => Math.max(x || Infinity, y || Infinity), 0) || undefined,
                    origin: report?.url,
                    reason: `Automod Actions: ${actions.join(", ")}`,
                });
        } catch {}
}

const past = {
    nothing: "",
    warn: "warned",
    mute: "muted",
    timeout: "timed out",
    kick: "kicked",
    ban: "banned",
} as const;
