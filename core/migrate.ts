import { ChannelType, Client } from "discord.js";
import { Collection, MongoClient } from "mongodb";
import {
    DBModmailMessage,
    DBPoll,
    DbAutomodSettings,
    DbAutoresponderSettings,
    DbCoOpSettings,
    DbCountSettings,
    DbCustomRolesSettings,
    DbGiveawaysSettings,
    DbLoggingSettings,
    DbModmailSettings,
    DbModulesPermissionsSettings,
    DbNukeguardSettings,
    DbReactionRolesSettings,
    DbRedditFeedsSettings,
    DbReportsSettings,
    DbSettings,
    DbStarboardSettings,
    DbStatsChannelsSettings,
    DbStickyRolesSettings,
    DbSuggestionsSettings,
    DbSupporterAnnouncementsSettings,
    DbTask,
    DbTicketsSettings,
    DbUtilitySettings,
    DbWelcomeSettings,
    DbXpSettings,
    DurationStyle,
    LimitKey,
    MessageData,
    PremiumTier,
    commandMap,
    formatDuration,
    logCategories,
    logEvents,
    parseCustomMessageString,
    parseMessage,
    premiumBenefits,
    schemas,
} from "shared";
import { autoIncrement, connect, db } from "shared/db.js";
import { z } from "zod";
import { log } from "./src/lib/log.js";

const defaultMessage: () => MessageData = () => ({ content: "", embeds: [], parsed: { content: [], embeds: [] } });
const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/);
const snowflakes = z.array(snowflake);

const start = Date.now();

const sections = (Bun.env.RUN ?? "").split(/\s+/).filter((x) => x);

async function section(key: string, fn: any) {
    if (sections.length === 0 || sections.includes(key)) {
        log.info(`section: ${key}`);
        await fn();
    }
}

function importMessage(data: any, isStatic: boolean) {
    data.content ??= "";
    data.embeds ??= [];
    data.embeds = data.embeds.filter((x: any) => x);

    for (const embed of data.embeds) {
        embed.colorMode = "fixed";
        embed.color ??= 0;
        embed.showTimestamp = false;

        embed.author ??= {};
        embed.author.name ??= "";
        embed.author.iconURL ??= "";
        embed.author.url ??= "";

        embed.thumbnail ??= { url: "" };
        embed.image ??= { url: "" };
        embed.footer ??= { text: "", iconURL: "" };
        embed.title ??= "";
        embed.description ??= "";
        embed.url ??= "";

        embed.fields ??= [];
    }

    return { ...data, parsed: parseMessage(data, isStatic) };
}

async function validate(schema: z.ZodType, collection: Collection<any>) {
    for await (const entry of collection.find())
        try {
            schema.parse(entry);
        } catch (error) {
            log.error(entry);
            log.error(error);

            log.fatal("Skipping remaining entries until this is fixed...");
            return;
        }

    const count = await collection.countDocuments();
    log.debug(`validated ${count} ${count === 1 ? "entry" : "entries"}.`);
}

const clients: Record<string, Client> = {};

async function getWebhook(channel: string, id: string): Promise<string | null> {
    const doc = await db.temporary.findOne({ type: "webhook", id });
    if (doc) return doc.url;

    let url: string | null = null;

    for (const token of [Bun.env.PROD_TOKEN!, ...(await db.guilds.find({ token: { $ne: null } }).toArray()).filter((x) => x.token).map((x) => x.token!)]) {
        if (!clients[token]) {
            clients[token] = new Client({ intents: 0 });
            await clients[token].login(token);
        }

        const ch = await clients[token].channels.fetch(channel).catch(() => {
            log.trace(`could not fetch channel ${channel}`);
        });

        if (!ch) continue;

        if (ch.type !== ChannelType.GuildAnnouncement && ch.type !== ChannelType.GuildText) {
            log.trace(`invalid channel type for ${channel}`);
            url = null;
            break;
        }

        const webhooks = await ch.fetchWebhooks().catch(() => {
            log.trace(`could not fetch webhooks in ${channel}`);
        });

        if (!webhooks) {
            url = null;
            break;
        }

        const webhook = webhooks.find((x) => x.id === id);

        url = webhook?.url ?? null;
        log.trace(`acquired webhook in channel ${channel} (${url === null ? "null" : "not null"})`);
        break;
    }

    await db.temporary.updateOne({ type: "webhook", id }, { $set: { url } }, { upsert: true });

    return url;
}

async function locate(channel: string | null): Promise<[boolean, string | null, string]> {
    if (channel === null) return [false, null, ""];

    const entry = await src.webhooks.findOne({ channel });
    if (!entry) return [false, channel, ""];

    const url = await getWebhook(channel, entry.id);
    return [!!url, channel, url ?? ""];
}

function collapse<T>(data: Record<string, T>) {
    return Object.entries(data).map(([guild, entry]) => ({ guild, ...entry }));
}

// TODO: re-enable this
// console.log("THIS WILL WIPE THE DATABASE. CTRL-C IN THE NEXT 5 SECONDS TO STOP IT.");
// await new Promise((r) => setTimeout(r, 5000));

await connect(Bun.env.DB_URI!, Bun.env.DB_NAME!);

const srcClient = new MongoClient(Bun.env.SRC_DB_URI!);
await srcClient.connect();
const srcDb = srcClient.db(Bun.env.SRC_DB_NAME);

const src = new Proxy(
    {},
    {
        get(_, key) {
            return srcDb.collection<any>(key as string);
        },
    },
) as Record<string, Collection<any>>;

await section("premium", async () => {
    await db.guilds.deleteMany();
    await db.premiumOverrides.deleteMany();

    const docs = await src.vanity_clients.find().toArray();

    await db.guilds.insertMany(
        docs.map((entry) => ({
            guild: entry.guild,
            tier: PremiumTier.FREE,
            token: entry.token,
        })),
    );

    await db.premiumOverrides.insertMany(docs.map((entry) => ({ guild: entry.guild, vanityClient: true })));

    async function coerceUp(entries: any[], key: LimitKey) {
        if (entries.length === 0) {
            log.warn(`coercion for ${key} included no entries`);
            return;
        }

        const lo: string[] = [];
        const hi: string[] = [];

        for (const { _id, count } of entries as { _id: string; count: number }[])
            if (count > premiumBenefits[PremiumTier.BASIC][`${key}Limit`]) hi.push(_id);
            else if (count > premiumBenefits[PremiumTier.FREE][`${key}Limit`]) lo.push(_id);

        if (lo.length > 0) {
            await db.premiumOverrides.updateMany(
                { guild: { $in: lo } },
                { $set: { [`${key}Limit`]: premiumBenefits[PremiumTier.BASIC][`${key}Limit`] } },
                { upsert: true },
            );

            log.trace(lo, `coerced up to basic tier (${key})`);
        }

        if (hi.length > 0) {
            await db.premiumOverrides.updateMany(
                { guild: { $in: hi } },
                { $set: { [`${key}Limit`]: premiumBenefits[PremiumTier.ULTIMATE][`${key}Limit`] } },
                { upsert: true },
            );

            log.trace(hi, `coerced up to ultimate tier (${key})`);
        }
    }

    async function groupAndCoerce(table: string, key: LimitKey) {
        await coerceUp(await src[table].aggregate([{ $group: { _id: "$guild", count: { $sum: 1 } } }]).toArray(), key);
    }

    await groupAndCoerce("supporter_announcements", "supporterAnnouncementsCount");

    const xp = await src.xp.find().toArray();

    await coerceUp(
        xp.map((x) => ({ _id: x.guild, count: x.bonus_channels.length })),
        "xpBonusChannelCount",
    );

    await coerceUp(
        xp.map((x) => ({ _id: x.guild, count: x.bonus_roles.length })),
        "xpBonusRoleCount",
    );

    await coerceUp(
        xp.map((x) => ({ _id: x.guild, count: x.roles.length })),
        "xpRewardCount",
    );

    await groupAndCoerce("reaction_roles", "reactionRolesCount");
    await groupAndCoerce("automod_rules", "automodCount");
    // no need to coerce autoroles; it doesn't exist yet

    const stats = await src.stats_channels.find().toArray();

    await coerceUp(
        stats.map((x) => ({ _id: x.guild, count: x.data.length })),
        "statsChannelsCount",
    );

    await groupAndCoerce("autoresponder_triggers", "autoresponderCount");
    await groupAndCoerce("ticket_prompts", "ticketPromptCount");
    // no need to coerce modmail or ticket targets; they don't exist yet
    await groupAndCoerce("feeds", "redditFeedsCount");
    await groupAndCoerce("count", "countCount");

    await validate(
        z.object({
            vanityClient: z.optional(z.boolean()),
            customizeXpBackgrounds: z.optional(z.boolean()),
            multiModmail: z.optional(z.boolean()),
            multiTickets: z.optional(z.boolean()),
            customizeTicketOpenMessage: z.optional(z.boolean()),
            supporterAnnouncementsCountLimit: z.optional(z.number()),
            xpBonusChannelCountLimit: z.optional(z.number()),
            xpBonusRoleCountLimit: z.optional(z.number()),
            xpRewardCountLimit: z.optional(z.number()),
            reactionRolesCountLimit: z.optional(z.number()),
            purgeAtOnceLimit: z.optional(z.number()),
            automodCountLimit: z.optional(z.number()),
            autorolesCountLimit: z.optional(z.number()),
            statsChannelsCountLimit: z.optional(z.number()),
            autoresponderCountLimit: z.optional(z.number()),
            modmailTargetCountLimit: z.optional(z.number()),
            ticketPromptCountLimit: z.optional(z.number()),
            ticketTargetCountLimit: z.optional(z.number()),
            redditFeedsCountLimit: z.optional(z.number()),
            countCountLimit: z.optional(z.number()),
        }),
        db.premiumOverrides,
    );
});

await section("automod", async () => {
    await db.automodSettings.deleteMany();

    const data: Record<string, DbAutomodSettings> = {};

    for await (const entry of src.automod.find())
        data[entry.guild] = {
            ignoredChannels: entry.ignored_channels.filter((x: any) => x),
            ignoredRoles: entry.ignored_roles.filter((x: any) => x),
            defaultChannel: entry.report_channel || null,
            interactWithWebhooks: entry.webhooks ?? false,
            rules: [],
        };

    for await (const entry of src.automod_rules.find())
        (data[entry.guild] ??= { ignoredChannels: [], ignoredRoles: [], defaultChannel: null, interactWithWebhooks: false, rules: [] }).rules.push({
            id: entry.id,
            enable: !entry.disabled,
            name: entry.name,
            type:
                {
                    text: "blocked-terms",
                    sticker_filter: "blocked-stickers",
                    caps: "caps-spam",
                    newlines: "newline-spam",
                    chars: "repeated-characters",
                    length: "length-limit",
                    emojis: "emoji-spam",
                    rate: "ratelimit",
                    files: "attachment-spam",
                    stickers: "sticker-spam",
                    linkspam: "link-spam",
                    invites: "invite-links",
                    links: "link-blocklist",
                    mentions: "mention-spam",
                }[entry.type as string] ?? entry.type,
            blockedTermsData: { terms: entry.data.text?.list ?? [] },
            blockedStickersData: { ids: entry.data.sticker_filter?.list ?? [] },
            capsSpamData: { ratioLimit: entry.data.caps?.ratio ?? 80, limit: entry.data.caps?.limit ?? 10 },
            newlineSpamData: { consecutiveLimit: entry.data.newlines?.consecutive ?? 5, totalLimit: entry.data.newlines?.limit ?? 15 },
            repeatedCharactersData: { consecutiveLimit: entry.data.chars?.consecutive ?? 20 },
            lengthLimitData: { limit: entry.data.length?.limit ?? 1200 },
            emojiSpamData: { limit: entry.data.emojis?.limit ?? 20, blockAnimatedEmoji: entry.data.emojis?.no_animated ?? false },
            ratelimitData: { threshold: entry.data.rate?.threshold ?? 5, timeInSeconds: entry.data.rate?.time ?? 5 },
            attachmentSpamData: { threshold: entry.data.files?.threshold ?? 5, timeInSeconds: entry.data.files?.time ?? 5 },
            stickerSpamData: { threshold: entry.data.stickers?.threshold ?? 5, timeInSeconds: entry.data.stickers?.time ?? 5 },
            linkSpamData: { threshold: entry.data.linkspam?.threshold ?? 5, timeInSeconds: entry.data.linkspam?.time ?? 5 },
            inviteLinksData: {
                blockUnknown: entry.data.invites?.block_by_default ?? false,
                allowed: entry.data.invites?.allow ?? [],
                blocked: entry.data.invites?.block ?? [],
            },
            linkBlocklistData: { websites: entry.data.links?.list ?? [] },
            mentionSpamData: {
                perMessageLimit: entry.data.mentions?.limit ?? 10,
                totalLimit: entry.data.mentions?.threshold ?? 10,
                timeInSeconds: entry.data.mentions?.time ?? 10,
                blockFailedEveryoneOrHere: entry.data.mentions?.block_everyone ?? false,
            },
            reportToChannel: entry.report ?? false,
            deleteMessage: entry.delete ?? false,
            notifyAuthor: entry.notify ?? false,
            reportChannel: entry.report_channel || null,
            additionalAction: entry.punishment,
            actionDuration: entry.duration ?? 0,
            disregardDefaultIgnoredChannels: entry.disregard_ignored_channels ?? false,
            disregardDefaultIgnoredRoles: entry.disregard_ignored_roles ?? false,
            onlyWatchEnabledChannels: entry.restrict_channels ?? false,
            onlyWatchEnabledRoles: entry.restrict_roles ?? false,
            ignoredChannels: entry.ignored_channels ?? [],
            ignoredRoles: entry.ignored_roles ?? [],
            watchedChannels: entry.unignored_channels ?? [],
            watchedRoles: entry.unignored_roles ?? [],
        });

    await db.automodSettings.insertMany(collapse(data));
    await validate(schemas.automod, db.automodSettings);
});

await section("autoresponder", async () => {
    await db.autoresponderSettings.deleteMany();

    const data: Record<string, DbAutoresponderSettings> = {};

    for await (const entry of src.autoresponder.find())
        data[entry.guild] = {
            allowedChannels: entry.allowed_channels ?? [],
            allowedRoles: entry.allowed_roles ?? [],
            blockedChannels: entry.blocked_channels ?? [],
            blockedRoles: entry.blocked_roles ?? [],
            onlyInAllowedChannels: entry.restrict_channels ?? false,
            onlyToAllowedRoles: entry.restrict_roles ?? false,
            triggers: [],
        };

    for await (const entry of src.autoresponder_triggers.find())
        (data[entry.guild] ??= {
            allowedChannels: [],
            allowedRoles: [],
            blockedChannels: [],
            blockedRoles: [],
            onlyInAllowedChannels: false,
            onlyToAllowedRoles: false,
            triggers: [],
        }).triggers.push({
            enabled: true,
            match: entry.match,
            wildcard: entry.wildcard ?? false,
            caseInsensitive: entry.case_insensitive ?? true,
            respondToBotsAndWebhooks: false,
            replyMode: { ping: "ping-reply" }[entry.reply as string] ?? entry.reply,
            reaction: entry.reaction ?? null,
            message: importMessage(entry.data, false),
            bypassDefaultChannelSettings: entry.ignore_channel_settings ?? false,
            bypassDefaultRoleSettings: entry.ignore_role_settings ?? false,
            onlyInAllowedChannels: entry.restrict_channels ?? false,
            onlyToAllowedRoles: entry.restrict_roles ?? false,
            allowedChannels: entry.allowed_channels ?? [],
            allowedRoles: entry.allowed_roles ?? [],
            blockedChannels: entry.blocked_channels ?? [],
            blockedRoles: entry.blocked_roles ?? [],
        });

    await db.autoresponderSettings.insertMany(collapse(data));
    await validate(schemas.autoresponder, db.autoresponderSettings);
});

await section("co-op", async () => {
    await db.coOpSettings.deleteMany();

    const data: Record<string, DbCoOpSettings> = {};

    for await (const entry of src.co_op.find())
        data[entry.guild] = {
            worldLevelRoles: entry.wl_roles.map((x: any) => x || null),
            regionRoles: ["na", "eu", "as", "sar"].map((x) => entry.region_roles[x] || null),
            helperRoles: ["na", "eu", "as", "sar"].map((x) => entry.helper_roles[x] || null),
        };

    await db.coOpSettings.insertMany(collapse(data));
    await validate(schemas["co-op"], db.coOpSettings);
});

await section("modules", async () => {
    await db.modulesPermissionsSettings.deleteMany();

    const data: Record<string, DbModulesPermissionsSettings> = {};

    for await (const entry of src.commands.find())
        (data[entry.guild] ??= { modules: {}, commands: {} }).commands[entry.command] = {
            enabled: entry.enabled ?? commandMap[entry.command]?.default ?? true,
            ignoreDefaultPermissions: entry.ignore ?? false,
            allowedRoles: entry.allowed ?? [],
            blockedRoles: entry.denied ?? [],
            restrictChannels: entry.restrict ?? false,
            allowedChannels: entry.allowlist ?? [],
            blockedChannels: entry.blocklist ?? [],
        };

    for await (const entry of src.modules.find())
        (data[entry.guild] ??= { modules: {}, commands: {} }).modules = Object.fromEntries([
            ...(entry.enabled ?? []).map((key: string) => [key, { enabled: true }]),
            ...(entry.disabled ?? []).map((key: string) => [key, { enabled: false }]),
        ]);

    await db.modulesPermissionsSettings.insertMany(collapse(data));
    await validate(schemas["modules-permissions"], db.modulesPermissionsSettings);
});

await section("count", async () => {
    await db.countSettings.deleteMany();
    await db.countScoreboards.deleteMany();

    const data: Record<string, DbCountSettings> = {};
    const channelMap: Record<string, [string, number]> = {};

    for await (const entry of src.count.find()) {
        const id = Math.random();
        if (entry.channel) channelMap[entry.channel] = [entry.guild, id];

        (data[entry.guild] ??= { channels: [] }).channels.push({
            id,
            channel: entry.channel || null,
            interval: entry.interval ?? 1,
            next: entry.next ?? 1,
            allowDoubleCounting: entry.double ?? false,
        });
    }

    const scoreData: Record<string, Record<number, { last: string; scores: Record<string, number> }>> = {};

    for await (const entry of src.count_scores.find())
        if (entry.channel in channelMap) {
            const [guild, id] = channelMap[entry.channel];

            (scoreData[guild] ??= {})[id] = {
                last: entry.last,
                scores: Object.fromEntries(Object.entries(entry).filter(([k]) => k.match(/^[1-9][0-9]{16,19}$/))) as Record<string, number>,
            };
        }

    await db.countSettings.insertMany(collapse(data));
    await validate(schemas.count, db.countSettings);

    await db.countScoreboards.insertMany(Object.entries(scoreData).flatMap(([k, v]) => Object.entries(v).map(([id, x]) => ({ guild: k, id: +id, ...x }))));
    await validate(
        z.object({
            guild: snowflake,
            id: z.number(),
            last: snowflake,
            scores: z.record(z.number().int()),
        }),
        db.countScoreboards,
    );
});

await section("custom-roles", async () => {
    await db.customRolesSettings.deleteMany();

    const data: Record<string, DbCustomRolesSettings> = {};

    for await (const entry of src.custom_role_settings.find())
        data[entry.guild] = { allowBoosters: entry.boosters ?? false, allowedRoles: entry.roles ?? [], anchor: entry.anchor || null };

    await db.customRolesSettings.insertMany(collapse(data));
    await validate(schemas["custom-roles"], db.customRolesSettings);
});

await section("custom-roles-entries", async () => {
    await db.customRoles.deleteMany();
    await db.customRoles.insertMany((await src.custom_roles.find().toArray()).filter((x) => x.guild));
    await validate(z.object({ guild: snowflake, user: snowflake, role: snowflake }), db.customRoles);
});

await section("reddit-feeds", async () => {
    await db.redditFeedsSettings.deleteMany();

    const data: Record<string, DbRedditFeedsSettings> = {};

    for await (const entry of src.feeds.find()) (data[entry.guild] ??= { feeds: [] }).feeds.push({ subreddit: entry.key, channel: entry.channel });

    await db.redditFeedsSettings.insertMany(collapse(data));
    await validate(schemas["reddit-feeds"], db.redditFeedsSettings);
});

await section("giveaways", async () => {
    await db.giveawaysSettings.deleteMany();
    await db.giveawayEntries.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^giveaways\// } });

    const data: Record<string, DbGiveawaysSettings> = {};
    const idMap: Record<string, Record<number, number>> = {};

    for await (const entry of src.giveaways.find()) {
        (idMap[entry.guild] ??= {})[entry.id] = await autoIncrement(`giveaways/${entry.guild}`);
        (data[entry.guild] ??= {
            template: {
                channel: null,
                message: defaultMessage(),
                requiredRoles: [],
                requiredRolesAll: false,
                blockedRoles: [],
                blockedRolesAll: false,
                bypassRoles: [],
                bypassRolesAll: false,
                stackWeights: false,
                weights: [],
                winners: 1,
                allowRepeatWinners: false,
            },
            giveaways: [],
        }).giveaways.push({
            channel: entry.channel || null,
            message: importMessage(entry.data, true),
            requiredRoles: entry.required_roles ?? [],
            requiredRolesAll: entry.required_all ?? false,
            blockedRoles: entry.blocked_roles ?? [],
            blockedRolesAll: entry.blocked_all ?? false,
            bypassRoles: entry.bypass_roles ?? [],
            bypassRolesAll: entry.bypass_all ?? false,
            stackWeights: entry.stack ?? false,
            weights: entry.weights ?? [],
            winners: entry.winners ?? 1,
            allowRepeatWinners: entry.repeat ?? false,
            id: idMap[entry.guild][entry.id],
            name: entry.name,
            deadline: entry.end,
            messageId: entry.message,
            error: null,
            closed: entry.ended ?? false,
        });
    }

    for await (const entry of src.giveaway_templates.find()) {
        if (!(entry.id in (idMap[entry.guild] ?? {}))) continue;

        data[entry.guild] = {
            template: {
                channel: entry.channel || null,
                message: importMessage(entry.data, true),
                requiredRoles: entry.required_roles ?? [],
                requiredRolesAll: entry.required_all ?? false,
                blockedRoles: entry.blocked_roles ?? [],
                blockedRolesAll: entry.blocked_all ?? false,
                bypassRoles: entry.bypass_roles ?? [],
                bypassRolesAll: entry.bypass_all ?? false,
                stackWeights: entry.stack ?? false,
                weights: entry.weights ?? [],
                winners: entry.winners ?? 1,
                allowRepeatWinners: entry.repeat ?? false,
            },
            giveaways: data[entry.guild]?.giveaways ?? [],
        };
    }

    await db.giveawaysSettings.insertMany(collapse(data));
    await validate(schemas.giveaways, db.giveawaysSettings);

    await db.giveawayEntries.insertMany(
        (await src.giveaway_entries.find().toArray())
            .filter((entry) => entry.giveaway in (idMap[entry.guild] ?? {}))
            .map((entry) => ({ guild: entry.guild, id: idMap[entry.guild][entry.giveaway], user: entry.user })),
    );

    await validate(z.object({ guild: snowflake, id: z.number(), user: snowflake }), db.giveawayEntries);
});

await section("highlights", async () => {
    await db.highlights.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^history\// } });

    await db.highlights.insertMany(
        (await src.highlights.find().toArray()).map((entry) => ({
            ...entry,
            blockedChannels: entry.blocked_channels ?? [],
            blockedUsers: entry.blocked_users ?? [],
        })),
    );

    await validate(
        z.object({
            guild: snowflake,
            user: snowflake,
            phrases: z.optional(z.array(z.string())),
            replies: z.optional(z.boolean()),
            cooldown: z.optional(z.number()),
            delay: z.optional(z.number()),
            blockedChannels: z.optional(snowflakes),
            blockedUsers: z.optional(snowflakes),
        }),
        db.highlights,
    );
});

await section("history", async () => {
    await db.userHistory.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^history\// } });

    const data = (await src.history.find().toArray())
        .filter((entry) => entry.user.match(/^[1-9][0-9]{16,19}$/))
        .map(
            (entry) =>
                ({
                    ...Object.fromEntries(Object.entries(entry).filter(([k, v]) => (k === "duration" || k === "origin" ? v !== null : true))),
                    type: entry.type === "massban" ? "ban" : entry.type,
                    mod: entry.mod === -1 ? "959360773518413824" : entry.mod,
                    time: entry.time.getTime(),
                    reason: typeof entry.reason === "string" ? entry.reason : null,
                }) as any,
        );

    const idMap: Record<string, number> = {};
    for (const item of data) idMap[item.guild] = Math.max(idMap[item.guild] ?? 0, item.id);

    await db.counters.insertMany(Object.entries(idMap).map(([guild, id]) => ({ sequence: `history/${guild}`, value: id })));

    await db.userHistory.insertMany(data);

    await validate(
        z.object({
            guild: snowflake,
            user: snowflake,
            id: z.number(),
            type: z.enum(["ban", "kick", "timeout", "mute", "informal_warn", "warn", "bulk"]),
            mod: snowflake,
            time: z.number(),
            duration: z.optional(z.number()),
            origin: z.optional(z.string()),
            reason: z.nullable(z.string()),
        }),
        db.userHistory,
    );
});

await section("modmail", async () => {
    await db.modmailSettings.deleteMany();
    await db.modmailNotifications.deleteMany();
    await db.modmailTargets.deleteMany();
    await db.modmailThreads.deleteMany();

    const data: Record<string, DbModmailSettings> = {};
    const idMap: Record<string, number> = {};

    for await (const entry of src.modmail.find()) {
        const openMessage = (entry.open_message ?? "").replace(/\{user\}/g, "\\{user\\}");
        const closeMessage = (entry.close_message ?? "").replace(/\{user\}/g, "\\{user\\}");

        data[entry.guild] = {
            multi: false,
            snippets: [],
            targets: [
                {
                    id: (idMap[entry.guild] = Math.random()),
                    name: "Default Target",
                    description: "Replace/remove this description.",
                    emoji: null,
                    logChannel: entry.log,
                    category: entry.category,
                    pingRoles: entry.ping_roles,
                    pingHere: !!entry.ping_here,
                    useThreads: !!entry.threads,
                    accessRoles: entry.access_roles,
                    openMessage,
                    closeMessage,
                    openMessageParsed: parseCustomMessageString(openMessage),
                    closeMessageParsed: parseCustomMessageString(closeMessage),
                },
            ],
        };
    }

    await db.modmailSettings.insertMany(collapse(data));
    await validate(schemas.modmail, db.modmailSettings);

    await db.modmailNotifications.insertMany(
        (await src.modmail_notifications.find().toArray())
            .filter((entry) => entry.mode !== 0)
            .map((entry) => ({
                channel: entry.channel,
                user: entry.user,
                once: entry.mode === 1,
            })),
    );

    await validate(z.object({ channel: snowflake, user: snowflake, once: z.boolean() }), db.modmailNotifications);

    await db.modmailTargets.insertMany(await src.modmail_targets.find().toArray());
    await validate(z.object({ guild: snowflake, user: snowflake }), db.modmailTargets);

    await db.modmailThreads.insertMany(
        (await src.modmail_threads.find().toArray()).map((entry) => ({
            guild: entry.guild,
            user: entry.user,
            id: idMap[entry.guild] ?? -1,
            uuid: crypto.randomUUID(),
            channel: entry.thread,
            closed: entry.closed,
            messages: entry.messages
                .map(
                    (x: any) =>
                        (x.type === "open" || x.type === "reopen"
                            ? {
                                  type: "open",
                                  author: entry.user,
                                  targetName: entry.guild in idMap ? "Default Target" : "Missing Target",
                                  time: x.time.getTime(),
                              }
                            : x.type === "incoming"
                              ? {
                                    type: "incoming",
                                    content: x.content ?? "",
                                    attachments: x.files.map((s: string) => ({ name: s.split("/").at(-1)!, url: s })),
                                    time: x.time.getTime(),
                                }
                              : x.type === "internal"
                                ? {
                                      type: "internal",
                                      author: x.author,
                                      content: x.content ?? "",
                                      attachments: x.files.map((s: string) => ({ name: s.split("/").at(-1)!, url: s })),
                                      time: x.time.getTime(),
                                  }
                                : x.type === "outgoing"
                                  ? {
                                        type: "outgoing",
                                        source: "",
                                        message: "",
                                        author: x.author,
                                        anon: !!x.anon,
                                        content: x.content ?? "",
                                        attachments: x.files.map((s: string) => ({ name: s.split("/").at(-1)!, url: s })),
                                        deleted: !!x.deleted,
                                        time: x.time.getTime(),
                                    }
                                  : x.type === "close"
                                    ? {
                                          type: "close",
                                          author: x.author,
                                          content: x.content ?? "",
                                          sent: !!x.content,
                                          time: x.time.getTime(),
                                      }
                                    : null) satisfies DBModmailMessage | null,
                )
                .filter((x: any) => x),
        })),
    );

    await validate(
        z.object({
            guild: snowflake,
            user: snowflake,
            id: z.number(),
            uuid: z.string(),
            channel: snowflake,
            closed: z.boolean(),
            messages: z.array(
                z.intersection(
                    z.object({ time: z.number() }),
                    z.discriminatedUnion("type", [
                        z.object({ type: z.literal("open"), author: snowflake, targetName: z.nullable(z.string()) }),
                        z.object({ type: z.literal("incoming"), content: z.string(), attachments: z.array(z.object({ name: z.string(), url: z.string() })) }),
                        z.object({
                            type: z.literal("internal"),
                            author: snowflake,
                            content: z.string(),
                            attachments: z.array(z.object({ name: z.string(), url: z.string() })),
                        }),
                        z.object({
                            type: z.literal("outgoing"),
                            source: z.string(),
                            message: z.string(),
                            author: snowflake,
                            anon: z.boolean(),
                            content: z.string(),
                            attachments: z.array(z.object({ name: z.string(), url: z.string() })),
                            edits: z.optional(z.array(z.string())),
                            deleted: z.boolean(),
                        }),
                        z.object({ type: z.literal("close"), author: snowflake, content: z.string(), sent: z.boolean() }),
                    ]),
                ),
            ),
        }),
        db.modmailThreads,
    );
});

await section("notes", async () => {
    await db.userNotes.deleteMany();

    await db.userNotes.insertMany(await src.notes.find().toArray());

    await validate(z.object({ guild: snowflake, user: snowflake, notes: z.string() }), db.userNotes);
});

await section("nukeguard", async () => {
    await db.nukeguardSettings.deleteMany();

    const data: Record<string, DbNukeguardSettings> = {};

    for await (const entry of src.nukeguard.find())
        data[entry.guild] = {
            alertChannel: entry.log,
            pingRoles: entry.ping_roles ?? [],
            pingHere: !!entry.ping_here,
            exemptedRoles: entry.exempted,
            watchChannelsByDefault: entry.watch_channels_by_default ?? false,
            ignoredChannels: entry.ignored_channels ?? [],
            watchedChannels: entry.watched_channels ?? [],
            watchRolesByDefault: entry.watch_roles_by_default ?? false,
            ignoredRoles: entry.ignored_roles ?? [],
            watchedRoles: entry.watched_roles ?? [],
            watchEmojiByDefault: entry.watch_emoji_and_stickers_by_default ?? false,
            ignoredEmoji: entry.ignored_emoji ?? [],
            watchedEmoji: entry.watched_emoji ?? [],
            watchStickersByDefault: entry.watch_emoji_and_stickers_by_default ?? false,
            ignoredStickers: entry.ignored_stickers ?? [],
            watchedStickers: entry.watched_stickers ?? [],
            watchSoundsByDefault: false,
            ignoredSounds: [],
            watchedSounds: [],
            preventWebhookCreation: !!entry.block_webhook_creation,
            watchWebhookDeletion: !!entry.watch_webhook_deletion,
            ratelimitEnabled: !!entry.ratelimit_enabled,
            ratelimitKicks: !!entry.ratelimit_kicks,
            threshold: entry.ratelimit_limit ?? null,
            timeInSeconds: entry.ratelimit_time ?? null,
            restrictRolesLenientMode: !!entry.roles_lenient,
            restrictRolesBlockByDefault: !!entry.roles_block_by_default,
            restrictRolesAllowedRoles: entry.roles_allowed ?? [],
            restrictRolesBlockedRoles: entry.roles_blocked ?? [],
        };

    await db.nukeguardSettings.insertMany(collapse(data));
    await validate(schemas.nukeguard, db.nukeguardSettings);
});

await section("polls", async () => {
    await db.polls.deleteMany();

    const data: Record<string, DBPoll> = {};

    for await (const entry of src.polls.find())
        if (["yes-no", "binary", "multi"].includes(entry.type))
            data[entry.message] =
                entry.type === "yes-no"
                    ? { question: entry.question ?? "", type: "yes-no", allowNeutral: !!entry.allow_neutral, votes: {} }
                    : entry.type === "binary"
                      ? {
                            question: entry.question,
                            type: "binary",
                            leftOption: entry.left_option.trim().slice(0, 80),
                            rightOption: entry.right_option.trim().slice(0, 80),
                            allowNeutral: !!entry.allow_neutral,
                            votes: {},
                        }
                      : { question: entry.question, type: "multi", options: entry.options, allowMulti: !!entry.allow_multi, votes: {} };

    for await (const entry of src.poll_votes.find()) {
        const poll = data[entry.message];
        if (!poll) continue;

        poll.votes[entry.user] = poll.type === "multi" ? [entry.option].flat() : entry.option;
    }

    await db.polls.insertMany(Object.entries(data).map(([message, entry]) => ({ message, ...entry })));
    await validate(
        z.intersection(
            z.object({ question: z.string().max(1024) }),
            z.discriminatedUnion("type", [
                z.object({ type: z.literal("yes-no"), allowNeutral: z.boolean(), votes: z.record(z.string()) }),
                z.object({
                    type: z.literal("binary"),
                    leftOption: z.string().max(80),
                    rightOption: z.string().max(80),
                    allowNeutral: z.boolean(),
                    votes: z.record(z.string()),
                }),
                z.object({
                    type: z.literal("multi"),
                    options: z.array(z.string()).min(2).max(10),
                    allowMulti: z.boolean(),
                    votes: z.record(z.array(z.string())),
                }),
            ]),
        ),
        db.polls,
    );
});

await section("reaction-roles", async () => {
    await db.reactionRolesSettings.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^reaction-role-ids\// } });

    const data: Record<string, DbReactionRolesSettings> = {};

    for await (const entry of src.reaction_roles.find())
        (data[entry.guild] ??= { entries: [] }).entries.push({
            id: await autoIncrement(`reaction-role-ids/${entry.guild}`),
            name: entry.name,
            addReactionsToExistingMessage: !!entry.parasite,
            channel: entry.channel,
            message: entry.message,
            url: entry.parasite ? `https://discord.com/channels/${entry.guild}/${entry.channel}/${entry.message}` : "",
            style: entry.style,
            type: entry.type,
            dropdownData: entry.entries.dropdown.filter((x: any) => x.role).map((x: any) => ({ ...x, description: x.description ?? "" })),
            buttonData: entry.entries.buttons.map((x: any) => x.map((x: any) => ({ ...x, color: x.color === "grey" ? "gray" : x.color }))),
            reactionData: entry.entries.reactions.filter((x: any) => x.role),
            promptMessage: importMessage(entry.data, true),
            error: null,
        });

    await db.reactionRolesSettings.insertMany(collapse(data));
    await validate(schemas["reaction-roles"], db.reactionRolesSettings);
});

await section("reporters", async () => {
    await db.reporters.deleteMany();

    await db.reporters.insertMany(await src.reporters.find().toArray());

    await validate(z.object({ message: snowflake, user: snowflake }), db.reporters);
});

await section("reports", async () => {
    await db.reportsSettings.deleteMany();

    const data: Record<string, DbReportsSettings> = {};

    for await (const entry of src.reports.find())
        data[entry.guild] = {
            outputChannel: entry.channel,
            anonymous: !!entry.anon,
            pingRoles: [],
            viewRoles: entry.roles,
        };

    await db.reportsSettings.insertMany(collapse(data));
    await validate(schemas.reports, db.reportsSettings);
});

await section("guild-settings", async () => {
    await db.guildSettings.deleteMany();

    const data: Record<string, DbSettings> = {};

    for await (const entry of src.settings.find())
        data[entry.guild] = {
            dashboardPermissions: { default: "manager" }[entry.dashboard_permissions as string] ?? entry.dashboard_permissions ?? "manager",
            embedColor: entry.embed_color,
            muteRole: entry.mute_role || null,
            banFooter: entry.ban_footer ?? "",
            modOnly: entry.permissions.modonly ?? false,
            allowedRoles: entry.permissions.allowed_roles,
            blockedRoles: entry.permissions.blocked_roles,
            allowlistOnly: entry.permissions.allowlist ?? false,
            allowedChannels: entry.permissions.allowed_channels ?? [],
            blockedChannels: entry.permissions.blocked_channels ?? [],
        };

    await db.guildSettings.insertMany(collapse(data));
    await validate(schemas["-"], db.guildSettings);
});

await section("logging", async () => {
    await db.loggingSettings.deleteMany();

    const data: Record<string, DbLoggingSettings> = {};

    for await (const entry of src.settings.find()) {
        const categories: DbLoggingSettings["categories"] = {};

        for (const key of Object.keys(logCategories)) {
            const [useWebhook, outputChannel, outputWebhook] = await locate(entry.log_settings.category_channels[key] ?? null);
            categories[key] = { enabled: entry.log_settings.enabled_categories.includes(key), useWebhook, outputChannel, outputWebhook, events: {} };
        }

        for (const [k, v] of Object.entries(logEvents)) {
            const [useWebhook, outputChannel, outputWebhook] = await locate(entry.log_settings.event_channels[k] ?? null);
            categories[v.category].events[k] = { enabled: !entry.log_settings.disabled_events.includes(k), useWebhook, outputChannel, outputWebhook };
        }

        const [useWebhook, defaultChannel, defaultWebhook] = await locate(entry.log_settings.default_channel);
        data[entry.guild] = {
            useWebhook,
            defaultChannel,
            defaultWebhook,
            ignoredChannels: entry.log_settings.ignored_channels,
            filesOnly: entry.log_settings.files_only,
            categories,
        };
    }

    await db.loggingSettings.insertMany(collapse(data));
    await validate(schemas.logging, db.loggingSettings);
});

await section("starboard", async () => {
    await db.starboardSettings.deleteMany();
    await db.starboardLinks.deleteMany();

    const data: Record<string, DbStarboardSettings> = {};

    for await (const entry of src.starboard.find())
        data[entry.guild] = {
            detectEmoji: entry.emoji,
            defaultChannel: entry.default_channel,
            defaultThreshold: entry.default_threshold === null ? null : Math.max(entry.default_threshold, 2),
            channels: Object.fromEntries(
                Object.entries(entry)
                    .filter(([k]) => k.match(/^[1-9][0-9]{16,19}$/))
                    .map(([k, v]: any) => [
                        k,
                        { disable: !!v.disabled, overrideChannel: v.target, overrideThreshold: v.threshold === null ? null : Math.max(v.threshold, 2) },
                    ]),
            ),
        };

    await db.starboardSettings.insertMany(collapse(data));
    await validate(schemas.starboard, db.starboardSettings);

    await db.starboardLinks.insertMany(await src.starlinks.find().toArray());
    await validate(z.object({ message: snowflake, target: snowflake }), db.starboardLinks);
});

await section("stats-channels", async () => {
    await db.statsChannelsSettings.deleteMany();

    const data: Record<string, DbStatsChannelsSettings> = {};

    for await (const entry of src.stats_channels.find())
        data[entry.guild] = { channels: entry.data.map((x: any) => ({ channel: x.channel, format: x.value, parsed: parseCustomMessageString(x.value) })) };

    await db.statsChannelsSettings.insertMany(collapse(data));
    await validate(schemas["stats-channels"], db.statsChannelsSettings);
});

await section("sticky-messages", async () => {
    await db.stickyMessages.deleteMany();

    await db.stickyMessages.insertMany(
        (await src.sticky_messages.find().toArray()).map((entry) => ({
            guild: entry.guild,
            channel: entry.channel,
            ...(entry.message ? { message: entry.message } : {}),
            content: entry.content,
            seconds: entry.seconds ?? 4,
        })),
    );

    await validate(
        z.object({ guild: snowflake, channel: snowflake, message: z.optional(snowflake), content: z.string(), seconds: z.number().int().min(4) }),
        db.stickyMessages,
    );
});

await section("sticky-roles", async () => {
    await db.stickyRolesSettings.deleteMany();
    await db.stickyRoles.deleteMany();

    const data: Record<string, DbStickyRolesSettings> = {};

    for await (const entry of src.sticky_roles.find())
        data[entry.guild] = {
            exclude: entry.exclude,
        };

    await db.stickyRolesSettings.insertMany(collapse(data));
    await validate(schemas["sticky-roles"], db.stickyRolesSettings);

    await db.stickyRoles.insertMany(await src.sticky_role_list.find().toArray());
    await validate(z.object({ guild: snowflake, user: snowflake, roles: snowflakes }), db.stickyRoles);
});

await section("suggestions", async () => {
    await db.suggestionsSettings.deleteMany();
    await db.suggestionPosts.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^suggestions\// } });

    const dataMap = Object.fromEntries(
        (await src.suggestion_posts.find().toArray()).map((entry) => [
            entry.message,
            {
                guild: entry.guild,
                id: entry.id,
                channel: entry.channel,
                user: entry.user,
                yes: [],
                no: [],
            },
        ]),
    );

    for await (const entry of src.suggestion_votes.find()) if (entry.message in dataMap) dataMap[entry.message][entry.vote].push(entry.user);

    const data = Object.entries(dataMap).map(([message, item]: any) => ({ message, ...item }));

    const idMap: Record<string, number> = {};
    for (const item of data) idMap[item.guild] = Math.max(idMap[item.guild] ?? 0, item.id);

    await db.counters.insertMany(Object.entries(idMap).map(([guild, id]) => ({ sequence: `suggestions/${guild}`, value: id })));

    await db.suggestionPosts.insertMany(data);
    await validate(
        z.object({ guild: snowflake, id: z.number(), channel: snowflake, message: snowflake, user: snowflake, yes: snowflakes, no: snowflakes }),
        db.suggestionPosts,
    );

    const entries: Record<string, DbSuggestionsSettings> = {};

    for await (const entry of src.suggestions.find())
        entries[entry.guild] = {
            outputChannel: entry.channel,
            anonymous: !!entry.anon,
        };

    await db.suggestionsSettings.insertMany(collapse(entries));
    await validate(schemas.suggestions, db.suggestionsSettings);
});

await section("supporter-announcements", async () => {
    await db.supporterAnnouncementSettings.deleteMany();

    const data: Record<string, DbSupporterAnnouncementsSettings> = {};

    for await (const entry of src.supporter_announcements.find()) {
        if (entry.guild === "1140271121216851989") entry.data.content = entry.data.content.replace(/\{user\}/, "\\{user\\}");

        (data[entry.guild] ??= { entries: [] }).entries.push({
            channel: entry.channel,
            boosts: !entry.role,
            role: entry.role,
            message: importMessage(entry.data, false),
        });
    }

    await db.supporterAnnouncementSettings.insertMany(collapse(data));
    await validate(schemas["supporter-announcements"], db.supporterAnnouncementSettings);
});

await section("tasks", async () => {
    await db.tasks.deleteMany();

    await db.tasks.insertMany(
        (await src.tasks.find().toArray())
            .map((entry): DbTask | null =>
                entry.action === "unban" || entry.action === "unmute"
                    ? { guild: entry.guild, time: entry.time.getTime(), action: entry.action, user: entry.user }
                    : entry.action === "modmail/close"
                      ? {
                            guild: entry.guild,
                            time: entry.time.getTime(),
                            action: entry.action,
                            channel: entry.channel,
                            author: entry.user,
                            notify: !!entry.message,
                            message: entry.message,
                        }
                      : entry.action === "remind"
                        ? {
                              guild: entry.guild,
                              time: entry.time.getTime(),
                              action: entry.action,
                              id: entry.id,
                              user: entry.user,
                              query: entry.query,
                              origin: entry.origin,
                          }
                        : null,
            )
            .filter((x) => x)
            .map((x) => x!),
    );

    await validate(
        z.intersection(
            z.object({ guild: z.nullable(snowflake), time: z.number() }),
            z.discriminatedUnion("action", [
                z.object({ action: z.enum(["unban", "unmute"]), user: snowflake }),
                z.object({
                    action: z.literal("modmail/close"),
                    guild: snowflake,
                    channel: snowflake,
                    author: snowflake,
                    notify: z.boolean(),
                    message: z.string(),
                }),
                z.object({ action: z.literal("remind"), id: z.number(), user: snowflake, query: z.nullable(z.string()), origin: z.string() }),
            ]),
        ),
        db.tasks,
    );
});

await section("tickets", async () => {
    await db.ticketsSettings.deleteMany();
    await db.tickets.deleteMany();
    await db.counters.deleteMany({ sequence: { $regex: /^tickets\// } });

    const data: Record<string, DbTicketsSettings> = {};
    const idMap: Record<string, Record<number, number>> = {};

    for await (const entry of src.ticket_prompts.find()) {
        const id = Math.random();
        (idMap[entry.guild] ??= {})[entry.id] = id;

        (data[entry.guild] ??= { prompts: [] }).prompts.push({
            id: entry.id,
            name: entry.name,
            channel: entry.channel,
            message: entry.message,
            prompt: importMessage(entry.prompt_data, true),
            multi: false,
            targets: [
                {
                    id,
                    name: entry.label,
                    description: "Replace/remove this description.",
                    logChannel: entry.log_channel,
                    category: entry.category,
                    accessRoles: entry.access_roles,
                    buttonColor: entry.color === "grey" ? "gray" : entry.color,
                    emoji: entry.emoji,
                    label: entry.label,
                    pingRoles: entry.ping_roles,
                    pingHere: entry.ping_here,
                    postCustomOpenMessage: entry.custom_open,
                    customOpenMessage: entry.custom_open ? importMessage(entry.on_open, false) : defaultMessage(),
                },
            ],
            error: null,
        });
    }

    const collapsed = collapse(data);

    await db.counters.insertMany(collapsed.map((entry) => ({ sequence: `tickets/${entry.guild}`, value: Math.max(...entry.prompts.map((x) => x.id)) })));

    await db.ticketsSettings.insertMany(collapsed);
    await validate(schemas.tickets, db.ticketsSettings);

    await db.tickets.insertMany(
        (await src.tickets.find().toArray())
            .filter((x) => x.created)
            .map((entry) => ({
                guild: entry.guild,
                user: entry.user,
                prompt: entry.prompt,
                target: idMap[entry.guild]?.[entry.prompt] ?? -1,
                uuid: crypto.randomUUID(),
                closed: entry.closed,
                channel: entry.channel,
                created: entry.created.getTime(),
                messages: entry.messages
                    .map((x: any) =>
                        x.type === "open"
                            ? { time: x.time.getTime(), type: "open" }
                            : x.type === "message"
                              ? {
                                    time: x.time.getTime(),
                                    type: "message",
                                    id: x.id || null,
                                    author: x.author,
                                    content: x.content,
                                    attachments: x.files.map((s: string) => ({ name: s.split("/").at(-1)!, url: s })),
                                    edits: entry.changes?.[x.id] ?? [],
                                    deleted: (!!x.id && entry.deleted?.includes(x.id)) ?? false,
                                }
                              : x.type === "close"
                                ? { time: x.time.getTime(), type: "close", author: x.author }
                                : null,
                    )
                    .filter((x: any) => x),
            })),
    );

    await validate(
        z.object({
            guild: snowflake,
            user: snowflake,
            prompt: z.number(),
            target: z.number(),
            uuid: z.string(),
            closed: z.boolean(),
            channel: snowflake,
            created: z.number(),
            messages: z.array(
                z.intersection(
                    z.object({ time: z.number() }),
                    z.discriminatedUnion("type", [
                        z.object({ type: z.literal("open") }),
                        z.object({
                            type: z.literal("message"),
                            id: z.nullable(snowflake),
                            author: snowflake,
                            content: z.string(),
                            attachments: z.array(z.object({ name: z.string(), url: z.string() })),
                            edits: z.optional(z.array(z.string())),
                            deleted: z.optional(z.boolean()),
                        }),
                        z.object({ time: z.number(), type: z.literal("close"), author: snowflake }),
                    ]),
                ),
            ),
        }),
        db.tickets,
    );
});

await section("utility", async () => {
    await db.utilitySettings.deleteMany();

    const data: Record<string, DbUtilitySettings> = {};

    for await (const entry of src.utility.find())
        data[entry.guild] = {
            blockRolesByDefault: !!entry.block_roles_by_default,
            allowedRoles: entry.allowed_roles ?? [],
            blockedRoles: entry.blocked_roles ?? [],
            bypassRoles: entry.bypass_roles ?? [],
        };

    await db.utilitySettings.insertMany(collapse(data));
    await validate(schemas.utility, db.utilitySettings);
});

await section("globals", async () => {
    await db.globals.deleteMany();
    await db.globals.insertOne({ lastXpPurge: (await src.variables.findOne({ key: "xp_last_update" }))?.value?.getTime() ?? 0 });

    await validate(z.object({ lastXpPurge: z.optional(z.number()), currencies: z.optional(z.record(z.number())) }), db.globals);
});

await section("welcome", async () => {
    await db.welcomeSettings.deleteMany();

    const data: Record<string, DbWelcomeSettings> = {};

    for await (const entry of src.welcome.find())
        if (entry.data) {
            if (entry.guild === "799069920402341889") entry.data.content = entry.data.content.replace(/\{member_mention\}/, "{mention}");
            if (entry.guild === "866654580753432636")
                entry.data.embeds.forEach(
                    (x: any) => (x.description = x.description.replace(/\{user\(proper\)\}/, "{mention}").replace(/\{server\(members\)\}/, "{members}")),
                );
            if (entry.guild === "1019050997093519451")
                entry.data.embeds.forEach((x: any) => (x.footer.text = x.footer.text.replace(/\{ordinal members\}/, "{ordinal {members}}")));

            data[entry.guild] = {
                channel: entry.channel || null,
                message: importMessage(entry.data, false),
            };
        }

    await db.welcomeSettings.insertMany(collapse(data));
    await validate(schemas.welcome, db.welcomeSettings);
});

await section("xp", async () => {
    await db.xpSettings.deleteMany();
    await db.xpAmounts.deleteMany();

    const data: Record<string, DbXpSettings> = {};

    for await (const entry of src.xp.find())
        data[entry.guild] = {
            blockedChannels: entry.blocked_channels,
            blockedRoles: entry.blocked_roles,
            bonusChannels: entry.bonus_channels.map((x: any) => ({ channel: x.channel, multiplier: x.amount })),
            bonusRoles: entry.bonus_roles.map((x: any) => ({ role: x.role, multiplier: x.amount })),
            rankCardBackground: entry.rankcard ?? "",
            announceLevelUp: !!entry.announce,
            announceInChannel: !entry.channel,
            announceChannel: entry.channel || null,
            announcementBackground: entry.levelup || "",
            rewards: entry.roles.map((x: any) => ({
                text: x.text || null,
                voice: x.voice || null,
                role: x.role,
                removeOnHigher: x.remove,
                dmOnReward: x.dm,
            })),
        };

    await db.xpSettings.insertMany(collapse(data));
    await validate(schemas.xp, db.xpSettings);

    await db.xpAmounts.insertMany(await src.xp_amounts.find().toArray());

    await validate(
        z.object({
            guild: snowflake,
            user: snowflake,
            daily: z.object({ text: z.number(), voice: z.number() }),
            weekly: z.object({ text: z.number(), voice: z.number() }),
            monthly: z.object({ text: z.number(), voice: z.number() }),
            total: z.object({ text: z.number(), voice: z.number() }),
        }),
        db.xpAmounts,
    );
});

await section("counters", async () => {
    await db.counters.deleteMany({ sequence: { $regex: /^(reminders)\// } });
    await db.counters.insertMany((await src.counters.find({ seq: { $regex: /^(reminders)\// } }).toArray()).map((x) => ({ sequence: x.seq, value: x.val })));
    await validate(z.object({ sequence: z.string(), value: z.number() }), db.counters);
});

const elapsed = Date.now() - start;
const display = formatDuration(Math.floor(elapsed / 1000) * 1000, DurationStyle.Blank);
log.debug(`took ${display === "no time" ? "0 seconds" : display} ${elapsed % 1000} ms`);
process.exit(0);
