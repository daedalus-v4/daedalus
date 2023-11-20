import type { APIGuild, Guild } from "discord.js";
import { Db, MongoClient } from "mongodb";
import {
    DBPoll,
    DBTicket,
    DbAutomodSettings,
    DbAutoresponderSettings,
    DbCoOpSettings,
    DbCountSettings,
    DbCustomRolesSettings,
    DbGiveawaysSettings,
    DbGlobals,
    DbLoggingSettings,
    DbModmailSettings,
    DbModmailThread,
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
    DbUserHistory,
    DbUtilitySettings,
    DbWelcomeSettings,
    DbXpAmounts,
    DbXpSettings,
    PremiumBenefits,
    commandMap,
    getLimit,
    limits,
    modules,
} from ".";
import { PremiumTier, premiumBenefits } from "./src/premium.js";

export let _db: Db;
export let client: MongoClient;

export let databaseIsReady = false;

export async function connect(uri: string, name: string) {
    client = new MongoClient(uri);
    await client.connect();
    _db = client.db(name);

    databaseIsReady = true;
}

type WithGuild<T> = T & { guild: string };

class Database {
    public get globals() {
        return _db.collection<DbGlobals>("globals");
    }

    public get tasks() {
        return _db.collection<DbTask>("tasks");
    }

    public get customers() {
        return _db.collection<{ discord: string; stripe: string }>("customers");
    }

    public get paymentLinks() {
        return _db.collection<{ key: string; links: [string, string, string, string] }>("payment_links");
    }

    public get premiumKeys() {
        return _db.collection<{ user: string; keys: string[] }>("premium_keys");
    }

    public get premiumKeyBindings() {
        return _db.collection<{ key: string; guild: string; disabled?: boolean }>("activated_keys");
    }

    public get counters() {
        return _db.collection<{ sequence: string; value: number }>("counters");
    }

    public get admins() {
        return _db.collection<{ user: string }>("admins");
    }

    public get guilds() {
        return _db.collection<{ guild: string; tier: PremiumTier; token: string | null }>("guilds");
    }

    public get premiumOverrides() {
        return _db.collection<{ guild: string } & Partial<PremiumBenefits>>("premium_overrides");
    }

    public get guildSettings() {
        return _db.collection<WithGuild<DbSettings>>("guild_settings");
    }

    public get modulesPermissionsSettings() {
        return _db.collection<WithGuild<DbModulesPermissionsSettings>>("modules_permissions_settings");
    }

    public get loggingSettings() {
        return _db.collection<WithGuild<DbLoggingSettings>>("logging_settings");
    }

    public get welcomeSettings() {
        return _db.collection<WithGuild<DbWelcomeSettings>>("welcome_settings");
    }

    public get supporterAnnouncementSettings() {
        return _db.collection<WithGuild<DbSupporterAnnouncementsSettings>>("supporter_announcements_settings");
    }

    public get xpSettings() {
        return _db.collection<WithGuild<DbXpSettings>>("xp_settings");
    }

    public get reactionRolesSettings() {
        return _db.collection<WithGuild<DbReactionRolesSettings>>("reaction_roles_settings");
    }

    public get starboardSettings() {
        return _db.collection<WithGuild<DbStarboardSettings>>("starboard_settings");
    }

    public get automodSettings() {
        return _db.collection<WithGuild<DbAutomodSettings>>("automod_settings");
    }

    public get stickyRolesSettings() {
        return _db.collection<WithGuild<DbStickyRolesSettings>>("sticky_roles_settings");
    }

    public get customRolesSettings() {
        return _db.collection<WithGuild<DbCustomRolesSettings>>("custom_roles_settings");
    }

    public get statsChannelsSettings() {
        return _db.collection<WithGuild<DbStatsChannelsSettings>>("stats_channels_settings");
    }

    public get autoresponderSettings() {
        return _db.collection<WithGuild<DbAutoresponderSettings>>("autoresponder_settings");
    }

    public get modmailSettings() {
        return _db.collection<WithGuild<DbModmailSettings>>("modmail_settings");
    }

    public get ticketsSettings() {
        return _db.collection<WithGuild<DbTicketsSettings>>("tickets_settings");
    }

    public get nukeguardSettings() {
        return _db.collection<WithGuild<DbNukeguardSettings>>("nukeguard_settings");
    }

    public get suggestionsSettings() {
        return _db.collection<WithGuild<DbSuggestionsSettings>>("suggestions_settings");
    }

    public get coOpSettings() {
        return _db.collection<WithGuild<DbCoOpSettings>>("co_op_settings");
    }

    public get redditFeedsSettings() {
        return _db.collection<WithGuild<DbRedditFeedsSettings>>("reddit_feeds_settings");
    }

    public get countSettings() {
        return _db.collection<WithGuild<DbCountSettings>>("count_settings");
    }

    public get giveawaysSettings() {
        return _db.collection<WithGuild<DbGiveawaysSettings>>("giveaways_settings");
    }

    public get reportsSettings() {
        return _db.collection<WithGuild<DbReportsSettings>>("reports_settings");
    }

    public get utilitySettings() {
        return _db.collection<WithGuild<DbUtilitySettings>>("utility_settings");
    }

    public get xpAmounts() {
        return _db.collection<DbXpAmounts>("xp_amounts");
    }

    public get userHistory() {
        return _db.collection<DbUserHistory>("user_history");
    }

    public get userNotes() {
        return _db.collection<{ guild: string; user: string; notes: string }>("user_notes");
    }

    public get starboardLinks() {
        return _db.collection<{ message: string; target: string }>("starboard_links");
    }

    public get stickyRoles() {
        return _db.collection<{ guild: string; user: string; roles: string[] }>("sticky_roles");
    }

    public get customRoles() {
        return _db.collection<{ guild: string; user: string; role: string }>("custom_roles");
    }

    public get modmailThreads() {
        return _db.collection<DbModmailThread>("modmail_threads");
    }

    public get modmailTargets() {
        return _db.collection<{ guild: string; user: string }>("modmail_targets");
    }

    public get modmailNotifications() {
        return _db.collection<{ channel: string; user: string; once: boolean }>("modmail_notifications");
    }

    public get tickets() {
        return _db.collection<DBTicket>("tickets");
    }

    public get suggestionPosts() {
        return _db.collection<{ guild: string; id: number; channel: string; message: string; user: string; yes: string[]; no: string[] }>("suggestion_posts");
    }

    public get countScoreboards() {
        return _db.collection<{ guild: string; id: number; last: string; scores: Record<string, number> }>("count_scoreboards");
    }

    public get giveawayEntries() {
        return _db.collection<{ guild: string; id: number; user: string }>("giveaway_entries");
    }

    public get reporters() {
        return _db.collection<{ message: string; user: string }>("reporters");
    }

    public get polls() {
        return _db.collection<DBPoll & { message: string }>("polls");
    }

    public get highlights() {
        return _db.collection<{
            user: string;
            guild: string;
            phrases?: string[];
            replies?: boolean;
            cooldown?: number;
            delay?: number;
            blockedChannels?: string[];
            blockedUsers?: string[];
        }>("polls");
    }
}

export const db = new Database();

export async function autoIncrement(sequence: string) {
    const doc = await db.counters.findOneAndUpdate({ sequence }, { $inc: { value: 1 } }, { upsert: true });
    return (doc?.value ?? 0) + 1;
}

export async function isModuleEnabled(guild: string, module: string) {
    const doc = await db.modulesPermissionsSettings.findOne({ guild });
    return doc?.modules[module]?.enabled ?? modules[module]?.default ?? true;
}

export async function isCommandEnabled(guild: string, command: string) {
    const doc = await db.modulesPermissionsSettings.findOne({ guild });
    return doc?.commands[command]?.enabled ?? commandMap[command]?.default ?? true;
}

export async function getColor(ctx?: string | APIGuild | Guild | { guild: APIGuild | Guild }, defaultColor: number = 0x009688): Promise<number> {
    if (ctx) {
        const id = typeof ctx === "string" ? ctx : "guild" in ctx ? ctx.guild.id : ctx.id;

        const { embedColor } = (await db.guildSettings.findOne({ guild: id })) ?? {};
        if (embedColor !== undefined) return embedColor;
    }

    return defaultColor;
}

export async function getLimitFor(guild: Guild | APIGuild, key: keyof typeof limits) {
    return getLimit(key, (await getPremiumBenefitsFor(guild.id)).increasedLimits);
}

export async function getPremiumBenefitsFor(guild: string) {
    return {
        ...Object.assign(premiumBenefits[(await db.guilds.findOne({ guild }))?.tier ?? PremiumTier.FREE], (await db.premiumOverrides.findOne({ guild })) ?? {}),
        _id: undefined,
    };
}
