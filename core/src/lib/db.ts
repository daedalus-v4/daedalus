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
} from "../../../shared";
import log from "./log.js";

export let _db: Db;
export let client: MongoClient;

export async function connect() {
    client = new MongoClient(Bun.env.DB_URI!);
    await client.connect();
    _db = client.db(Bun.env.DB_NAME);
    log.info("DB connected.");
}

class Database {
    public get counters() {
        return _db.collection<{ sequence: string; value: number }>("counters");
    }

    public get admins() {
        return _db.collection<{ user: string }>("admins");
    }

    public get guildSettings() {
        return _db.collection<DbSettings>("guild_settings");
    }

    public get loggingSettings() {
        return _db.collection<DbLoggingSettings>("logging_settings");
    }

    public get welcomeSettings() {
        return _db.collection<DbWelcomeSettings>("welcome_settings");
    }

    public get supporterAnnouncementSettings() {
        return _db.collection<DbSupporterAnnouncementsSettings>("supporter_announcements_settings");
    }

    public get xpSettings() {
        return _db.collection<DbXpSettings>("xp_settings");
    }

    public get reactionRolesSettings() {
        return _db.collection<DbReactionRolesSettings>("reaction_roles_settings");
    }

    public get starboardSettings() {
        return _db.collection<DbStarboardSettings>("starboard_settings");
    }

    public get automodSettings() {
        return _db.collection<DbAutomodSettings>("automod_settings");
    }

    public get stickyRolesSettings() {
        return _db.collection<DbStickyRolesSettings>("sticky_roles_settings");
    }

    public get customRolesSettings() {
        return _db.collection<DbCustomRolesSettings>("custom_roles_settings");
    }

    public get statsChannelsSettings() {
        return _db.collection<DbStatsChannelsSettings>("stats_channels_settings");
    }

    public get autoresponderSettings() {
        return _db.collection<DbAutoresponderSettings>("autoresponder_settings");
    }

    public get modmailSettings() {
        return _db.collection<DbModmailSettings>("modmail_settings");
    }

    public get ticketsSettings() {
        return _db.collection<DbTicketsSettings>("tickets_settings");
    }

    public get nukeguardSettings() {
        return _db.collection<DbNukeguardSettings>("nukeguard_settings");
    }

    public get suggestionsSettings() {
        return _db.collection<DbSuggestionsSettings>("suggestions_settings");
    }

    public get coOpSettings() {
        return _db.collection<DbCoOpSettings>("co_op_settings");
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

const db = new Database();
export default db;

export async function autoIncrement(sequence: string) {
    const doc = await db.counters.findOneAndUpdate({ sequence }, { $inc: { value: 1 } }, { upsert: true });
    return (doc?.value ?? 0) + 1;
}
