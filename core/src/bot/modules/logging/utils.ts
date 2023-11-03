import {
    APIEmbedField,
    ChannelType,
    Guild,
    GuildAuditLogsEntry,
    GuildAuditLogsResolvable,
    GuildScheduledEventStatus,
    Message,
    PartialMessage,
} from "discord.js";
import { log } from "../../../lib/log.js";
import { expand, timestamp } from "../../lib/format.js";

export async function auditEntry(
    guild: Guild,
    type: GuildAuditLogsResolvable,
    target?: any,
    key: string = "id",
): Promise<GuildAuditLogsEntry | null | undefined> {
    const time = new Date().getTime();

    try {
        const logs = (await guild.fetchAuditLogs({ type })).entries;

        if (!target) {
            const entry = logs.first();
            if (!entry) return;

            if (time - entry.createdTimestamp <= 10000) return entry;

            return;
        }

        target = target[key] ?? target;

        for (const entry of logs.values()) {
            if (time - entry.createdTimestamp > 10000) return;
            if (entry.target && key in entry.target && entry.target[key as keyof typeof entry.target] === target) return entry;
        }
    } catch (error: any) {
        error.location = "91574df4-6549-46f6-894a-8b54f67db6db";
        log.error(error);
    }
}

export async function audit(guild: Guild, type: GuildAuditLogsResolvable, target?: any, key: string = "id") {
    return (await auditEntry(guild, type, target, key))?.executor;
}

export const to = "→";

export const channelTypes: Record<ChannelType, string> = {
    [ChannelType.AnnouncementThread]: "announcement thread",
    [ChannelType.DM]: "DM channel",
    [ChannelType.GroupDM]: "group DM channel",
    [ChannelType.GuildAnnouncement]: "announcement channel",
    [ChannelType.GuildCategory]: "category channel",
    [ChannelType.GuildDirectory]: "directory channel",
    [ChannelType.GuildForum]: "forum channel",
    [ChannelType.GuildStageVoice]: "stage channel",
    [ChannelType.GuildText]: "text channel",
    [ChannelType.GuildVoice]: "voice channel",
    [ChannelType.PrivateThread]: "private thread",
    [ChannelType.PublicThread]: "public thread",
};

export const archiveDurations = {
    0: "Default (3 days)",
    60: "1 hour",
    1440: "1 day",
    4320: "3 days",
    10080: "7 days",
};

export const statuses: Record<GuildScheduledEventStatus, string> = {
    [GuildScheduledEventStatus.Active]: "Active",
    [GuildScheduledEventStatus.Canceled]: "Canceled",
    [GuildScheduledEventStatus.Completed]: "Completed",
    [GuildScheduledEventStatus.Scheduled]: "Scheduled",
};

export function fieldsFor(message: Message | PartialMessage): APIEmbedField[] {
    return [
        message.reference
            ? {
                  name: "Reference",
                  value: `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`,
              }
            : [],
        { name: "Details", value: `Posted on ${timestamp(message.createdAt)} by ${expand(message.author)} in ${expand(message.channel)}` },
    ].flat();
}
