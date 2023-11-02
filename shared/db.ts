import { Db, MongoClient } from "mongodb";
import {
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
    DbPollsSettings,
    DbReactionRolesSettings,
    DbReportsSettings,
    DbSettings,
    DbStarboardSettings,
    DbStatsChannelsSettings,
    DbStickyRolesSettings,
    DbSuggestionsSettings,
    DbSupporterAnnouncementsSettings,
    DbTicketsSettings,
    DbUtilitySettings,
    DbWelcomeSettings,
    DbXpSettings,
    modules,
} from ".";
import { PremiumTier } from "./src/premium.js";

export let _db: Db;
export let client: MongoClient;

export async function connect(uri: string, name: string) {
    client = new MongoClient(uri);
    await client.connect();
    _db = client.db(name);
}

type WithGuild<T> = T & { guild: string };

class Database {
    public get counters() {
        return _db.collection<{ sequence: string; value: number }>("counters");
    }

    public get admins() {
        return _db.collection<{ user: string }>("admins");
    }

    public get guilds() {
        return _db.collection<{ guild: string; tier: PremiumTier; token: string | null }>("guilds");
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

    public get countSettings() {
        return _db.collection<DbCountSettings>("count_settings");
    }

    public get giveawaysSettings() {
        return _db.collection<DbGiveawaysSettings>("giveaways_settings");
    }

    public get reportsSettings() {
        return _db.collection<DbReportsSettings>("reports_settings");
    }

    public get pollsSettings() {
        return _db.collection<DbPollsSettings>("polls_settings");
    }

    public get utilitySettings() {
        return _db.collection<DbUtilitySettings>("utility_settings");
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
