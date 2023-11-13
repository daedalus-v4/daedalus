import type { FEMessageData, TFChannel, TFRole } from "shared";

export type FEData = {
    guild: string;
    roles: TFRole[];
    channels: TFChannel[];
};

export type FESettings = {
    dashboardPermissions: "owner" | "admin" | "manager";
    embedColor: string;
    muteRole: string | null;
    banFooter: string;
    modOnly: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    allowlistOnly: boolean;
    allowedChannels: string[];
    blockedChannels: string[];
};

export type FEModulesPermissionsSettings = {
    modules: Record<string, { enabled: boolean }>;
    commands: Record<
        string,
        {
            enabled: boolean;
            ignoreDefaultPermissions: boolean;
            allowedRoles: string[];
            blockedRoles: string[];
            restrictChannels: boolean;
            allowedChannels: string[];
            blockedChannels: string[];
        }
    >;
};

export type FEWelcomeSettings = {
    channel: string | null;
    message: FEMessageData;
};

export type FELoggingSettings = {
    useWebhook: boolean;
    defaultChannel: string | null;
    defaultWebhook: string;
    ignoredChannels: string[];
    filesOnly: boolean;
    categories: Record<
        string,
        {
            enabled: boolean;
            useWebhook: boolean;
            outputChannel: string | null;
            outputWebhook: string;
            events: Record<
                string,
                {
                    enabled: boolean;
                    useWebhook: boolean;
                    outputChannel: string | null;
                    outputWebhook: string;
                }
            >;
        }
    >;
};

export type FESupporterAnnouncementsSettings = {
    entries: {
        channel: string | null;
        boosts: boolean;
        role: string | null;
        message: FEMessageData;
    }[];
};

export type FEXpSettings = {
    blockedChannels: string[];
    blockedRoles: string[];
    bonusChannels: { channel: string | null; multiplier: number | null }[];
    bonusRoles: { role: string | null; multiplier: number | null }[];
    rankCardBackground: string;
    announceLevelUp: boolean;
    announceInChannel: boolean;
    announceChannel: string | null;
    announcementBackground: string;
    rewards: { text: number | null; voice: number | null; role: string | null; removeOnHigher: boolean; dmOnReward: boolean }[];
};

export type FEReactionRolesSettings = {
    entries: {
        id: number;
        name: string;
        addReactionsToExistingMessage: boolean;
        channel: string | null;
        message: string | null;
        url: string;
        style: "dropdown" | "buttons" | "reactions";
        type: "normal" | "unique" | "verify" | "lock";
        dropdownData: { emoji: string | null; role: string | null; label: string; description: string }[];
        buttonData: { emoji: string | null; role: string | null; color: "gray" | "blue" | "green" | "red"; label: string }[][];
        reactionData: { emoji: string | null; role: string | null }[];
        promptMessage: FEMessageData;
        error: string | null;
    }[];
};

export type FEStarboardSettings = {
    detectEmoji: string | null;
    defaultChannel: string | null;
    defaultThreshold: number | null;
    channels: Record<
        string,
        {
            disable: boolean;
            overrideChannel: string | null;
            overrideThreshold: number | null;
        }
    >;
};

export type FEAutomodSettings = {
    ignoredChannels: string[];
    ignoredRoles: string[];
    defaultChannel: string | null;
    interactWithWebhooks: boolean;
    rules: {
        id: number;
        enable: boolean;
        name: string;
        type:
            | "blocked-terms"
            | "blocked-stickers"
            | "caps-spam"
            | "newline-spam"
            | "repeated-characters"
            | "length-limit"
            | "emoji-spam"
            | "ratelimit"
            | "attachment-spam"
            | "sticker-spam"
            | "link-spam"
            | "invite-links"
            | "link-blocklist"
            | "mention-spam";
        blockedTermsData: { terms: string[] };
        blockedStickersData: { ids: string[] };
        capsSpamData: { ratioLimit: number; limit: number };
        newlineSpamData: { consecutiveLimit: number; totalLimit: number };
        repeatedCharactersData: { consecutiveLimit: number };
        lengthLimitData: { limit: number };
        emojiSpamData: { limit: number; blockAnimatedEmoji: boolean };
        ratelimitData: { threshold: number; timeInSeconds: number };
        attachmentSpamData: { threshold: number; timeInSeconds: number };
        stickerSpamData: { threshold: number; timeInSeconds: number };
        linkSpamData: { threshold: number; timeInSeconds: number };
        inviteLinksData: { blockUnknown: boolean; allowed: string[]; blocked: string[] };
        linkBlocklistData: { websites: string[] };
        mentionSpamData: { perMessageLimit: number; totalLimit: number; timeInSeconds: number; blockFailedEveryoneOrHere: boolean };
        reportToChannel: boolean;
        deleteMessage: boolean;
        notifyAuthor: boolean;
        reportChannel: string | null;
        additionalAction: "nothing" | "warn" | "mute" | "timeout" | "kick" | "ban";
        actionDuration: number;
        disregardDefaultIgnoredChannels: boolean;
        disregardDefaultIgnoredRoles: boolean;
        onlyWatchEnabledChannels: boolean;
        onlyWatchEnabledRoles: boolean;
        ignoredChannels: string[];
        ignoredRoles: string[];
        watchedChannels: string[];
        watchedRoles: string[];
    }[];
};

export type FEStickyRolesSettings = {
    exclude: string[];
};

export type FECustomRolesSettings = {
    allowBoosters: boolean;
    allowedRoles: string[];
    anchor: string | null;
};

export type FEStatsChannelsSettings = {
    channels: {
        channel: string | null;
        format: string;
    }[];
};

export type FEAutoresponderSettings = {
    onlyInAllowedChannels: boolean;
    onlyToAllowedRoles: boolean;
    allowedChannels: string[];
    allowedRoles: string[];
    blockedChannels: string[];
    blockedRoles: string[];
    triggers: {
        enabled: boolean;
        match: string;
        wildcard: boolean;
        caseInsensitive: boolean;
        respondToBotsAndWebhooks: boolean;
        replyMode: "normal" | "reply" | "ping-reply";
        reaction: string | null;
        message: FEMessageData;
        bypassDefaultChannelSettings: boolean;
        bypassDefaultRoleSettings: boolean;
        onlyInAllowedChannels: boolean;
        onlyToAllowedRoles: boolean;
        allowedChannels: string[];
        allowedRoles: string[];
        blockedChannels: string[];
        blockedRoles: string[];
    }[];
};

export type FEModmailSettings = {
    multi: boolean;
    snippets: { name: string; content: string }[];
    targets: {
        id: number;
        name: string;
        description: string;
        emoji: string | null;
        logChannel: string | null;
        category: string | null;
        pingRoles: string[];
        pingHere: boolean;
        useThreads: boolean;
        accessRoles: string[];
        openMessage: string;
        closeMessage: string;
    }[];
};
