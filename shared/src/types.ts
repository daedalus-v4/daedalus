import { ChannelType } from "discord.js";

export type ModuleData = Record<
    string,
    {
        name: string;
        icon?: string;
        description?: string;
        commands?: Record<
            string,
            {
                name: string;
                icon?: string;
                description?: string;
                ghost?: boolean;
                bypass?: boolean;
                admin?: boolean;
                permissions?: string[];
                selfPermissions?: string[];
                default?: boolean;
            }
        >;
        selfPermissions?: string[];
        default?: boolean;
    }
>;

export type PremiumBenefits = {
    name: string;
    vanityClient: boolean;
    increasedLimits: boolean;
    customizeXpBackgrounds: boolean;
};

export type IField = { name: string; value: string; inline: boolean };

export type IEmbed = {
    colorMode: "guild" | "member" | "user" | "fixed";
    color: number;
    author: { name: string; iconURL: string; url: string };
    title: string;
    description: string;
    url: string;
    fields: IField[];
    image: { url: string };
    thumbnail: { url: string };
    footer: { text: string; iconURL: string };
    showTimestamp: boolean;
};

export type FEIEmbed = Omit<IEmbed, "color" | "fields"> & { color: string; fields: (IField & { _meta?: any })[]; _meta?: any };

export type CustomMessageComponent = [string, ...(string | number | CustomMessageComponent)[]];
export type CustomMessageText = (string | CustomMessageComponent)[];

export type MessageData = {
    content: string;
    embeds: IEmbed[];
    parsed: {
        content: CustomMessageText;
        embeds: (Pick<IEmbed, "colorMode" | "color" | "showTimestamp"> & {
            author: { name: CustomMessageText; iconURL: CustomMessageText; url: CustomMessageText };
            title: CustomMessageText;
            description: CustomMessageText;
            url: CustomMessageText;
            fields: { name: CustomMessageText; value: CustomMessageText; inline: boolean }[];
            image: { url: CustomMessageText };
            thumbnail: { url: CustomMessageText };
            footer: { text: CustomMessageText; iconURL: CustomMessageText };
        })[];
    };
};

export type FEMessageData = {
    content: string;
    embeds: FEIEmbed[];
};

export type TFRole = {
    id: string;
    name: string;
    color: number;
    everyone?: boolean;
    managed?: boolean;
    higher?: boolean;
};

export type TFChannel = {
    id: string;
    type: ChannelType;
    position: number;
    name: string;
    parent?: string;
    readonly?: boolean;
    children?: TFChannel[];
};

export type TFEmoji = {
    id: string;
    name: string;
    url: string;
};

export type DbGlobals = {
    lastXpPurge: number;
};

export type DbTask = {
    guild: string;
    time: number;
} & ({ action: "unban"; user: string } | { action: "unmute"; user: string });

export type DbSettings = {
    dashboardPermissions: "owner" | "admin" | "manager";
    embedColor: number;
    muteRole: string | null;
    banFooter: string;
    modOnly: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    allowlistOnly: boolean;
    allowedChannels: string[];
    blockedChannels: string[];
};

export type DbModulesPermissionsSettings = {
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

export type DbLoggingSettings = {
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

export type DbWelcomeSettings = {
    channel: string | null;
    message: MessageData;
};

export type DbSupporterAnnouncementsSettings = {
    entries: {
        channel: string | null;
        boosts: boolean;
        role: string | null;
        message: MessageData;
    }[];
};

export type DbXpSettings = {
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

export type DbReactionRolesSettings = {
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
        promptMessage: MessageData;
        error: string | null;
    }[];
};

export type DbStarboardSettings = {
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

export type DbAutomodSettings = {
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

export type DbStickyRolesSettings = {
    exclude: string[];
};

export type DbCustomRolesSettings = {
    allowBoosters: boolean;
    allowedRoles: string[];
    anchor: string | null;
};

export type DbStatsChannelsSettings = {
    channels: {
        channel: string | null;
        format: string;
        parsed: CustomMessageText;
    }[];
};

export type DbAutoresponderSettings = {
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
        message: MessageData;
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

export type DbModmailSettings = {
    logChannel: string | null;
    category: string | null;
    pingRoles: string[];
    pingHere: boolean;
    useThreads: boolean;
    accessRoles: string[];
    openMessage: string;
    closeMessage: string;
    snippets: { name: string; content: string }[];
};

export type DbTicketsSettings = {
    prompts: {
        name: string;
        channel: string | null;
        logChannel: string | null;
        category: string | null;
        accessRoles: string[];
        buttonColor: "gray" | "blue" | "green" | "red";
        emoji: string | null;
        label: string;
        message: MessageData;
        pingRoles: string[];
        pingHere: boolean;
        postCustomOpenMessage: boolean;
        customOpenMessage: MessageData;
    }[];
};

export type DbNukeguardSettings = {
    alertChannel: string | null;
    pingRoles: string[];
    pingHere: boolean;
    exemptedRoles: string[];
    watchChannelsByDefault: boolean;
    ignoredChannels: string[];
    watchedChannels: string[];
    watchRolesByDefault: boolean;
    ignoredRoles: string[];
    watchedRoles: string[];
    watchExpressionsByDefault: boolean;
    ignoredEmoji: string[];
    ignoredStickers: string[];
    ignoredSounds: string[];
    watchedEmoji: string[];
    watchedStickers: string[];
    watchedSounds: string[];
    preventWebhookCreation: boolean;
    watchWebhookDeletion: boolean;
    ratelimitEnabled: boolean;
    ratelimitKicks: boolean;
    threshold: number;
    timeInSeconds: number;
    restrictRolesLenientMode: boolean;
    restrictRolesBlockByDefault: boolean;
    restrictRolesAllowedRoles: string[];
    restrictRolesBlockedRoles: string[];
};

export type DbSuggestionsSettings = {
    outputChannel: string | null;
    anonymous: boolean;
};

export type DbCoOpSettings = {
    worldLevelRoles: (string | null)[];
    regionRoles: (string | null)[];
    helperRoles: (string | null)[];
};

export type DbCountSettings = {
    channels: {
        channel: string | null;
        interval: number;
        next: number;
        allowDoubleCounting: boolean;
    }[];
};

type Giveaway = {
    channel: string | null;
    message: MessageData;
    requiredRoles: string[];
    requiredRolesAll: boolean;
    blockedRoles: string[];
    blockedRolesAll: boolean;
    bypassRoles: string[];
    bypassRolesAll: boolean;
    stackWeights: boolean;
    weights: { role: string | null; weight: number }[];
    winners: number;
    allowRepeatWinners: boolean;
};

export type DbGiveawaysSettings = {
    template: Giveaway;
    giveaways: (Giveaway & {
        name: string;
        deadline: number;
    })[];
};

export type DbReportsSettings = {
    outputChannel: string | null;
    anonymous: boolean;
    viewRoles: string[];
};

export type DbPollsSettings = {
    qotdRole: string | null;
};

export type DbUtilitySettings = {
    blockRolesByDefault: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    bypassRoles: string[];
};

export type DDLGuild = {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    features: string[];
    notIn?: boolean;
};

export type DbXpAmounts = {
    guild: string;
    user: string;
    daily: { text: number; voice: number };
    weekly: { text: number; voice: number };
    monthly: { text: number; voice: number };
    total: { text: number; voice: number };
};

export type DbUserHistory = {
    guild: string;
    user: string;
    id: number;
    type: "ban" | "kick" | "timeout" | "mute" | "informal_warn" | "warn" | "bulk";
    mod: string;
    time: number;
    duration?: number;
    origin?: string;
    reason: string | null;
};
