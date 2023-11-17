import type {
    CustomMessageComponent,
    CustomMessageText,
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
    DbSettings,
    DbStarboardSettings,
    DbStatsChannelsSettings,
    DbStickyRolesSettings,
    DbSuggestionsSettings,
    DbSupporterAnnouncementsSettings,
    DbTicketsSettings,
    DbWelcomeSettings,
    DbXpSettings,
    MessageData,
} from "shared";
import { z } from "zod";

const color = z.number().int().min(0).max(0xffffff);
const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/, "Expected a Discord ID (17-20 digit number).");
const snowflakes = z.array(snowflake);
const nsnowflake = z.nullable(snowflake);

function recurse<T>(item: z.ZodType<T>): z.ZodType<[string, ...(string | number | T)[]]> {
    return z.tuple([z.string()]).rest(z.union([z.string(), z.number(), item]));
}

let _cmc: z.ZodType<CustomMessageComponent> = z.tuple([z.string()]).rest(z.union([z.string(), z.number()]));
for (let x = 0; x < 10; x++) _cmc = recurse(_cmc);

const cmcomponent = _cmc;
const cmstring: z.ZodType<CustomMessageText> = z.array(z.union([z.string(), cmcomponent]));
const message: z.ZodType<MessageData> = z.object({
    content: z.string(),
    embeds: z
        .array(
            z.object({
                colorMode: z.enum(["guild", "member", "user", "fixed"]),
                color,
                author: z.object({ name: z.string(), iconURL: z.string(), url: z.string() }),
                title: z.string(),
                description: z.string(),
                url: z.string(),
                fields: z.array(z.object({ name: z.string(), value: z.string(), inline: z.boolean() })).max(25),
                image: z.object({ url: z.string() }),
                thumbnail: z.object({ url: z.string() }),
                footer: z.object({ text: z.string(), iconURL: z.string() }),
                showTimestamp: z.boolean(),
            }),
        )
        .max(10),
    parsed: z.object({
        content: cmstring,
        embeds: z
            .array(
                z.object({
                    colorMode: z.enum(["guild", "member", "user", "fixed"]),
                    color,
                    author: z.object({ name: cmstring, iconURL: cmstring, url: cmstring }),
                    title: cmstring,
                    description: cmstring,
                    url: cmstring,
                    fields: z.array(z.object({ name: cmstring, value: cmstring, inline: z.boolean() })).max(25),
                    image: z.object({ url: cmstring }),
                    thumbnail: z.object({ url: cmstring }),
                    footer: z.object({ text: cmstring, iconURL: cmstring }),
                    showTimestamp: z.boolean(),
                }),
            )
            .max(10),
    }),
});

const giveaway: z.ZodType<DbGiveawaysSettings["template"]> = z.object({
    channel: nsnowflake,
    message,
    requiredRoles: snowflakes,
    requiredRolesAll: z.boolean(),
    blockedRoles: snowflakes,
    blockedRolesAll: z.boolean(),
    bypassRoles: snowflakes,
    bypassRolesAll: z.boolean(),
    stackWeights: z.boolean(),
    weights: z.array(z.object({ role: nsnowflake, weight: z.number().int().min(1) })),
    winners: z.number().int().min(1),
    allowRepeatWinners: z.boolean(),
});

export default {
    "-": z.object({
        dashboardPermissions: z.enum(["owner", "admin", "manager"]),
        embedColor: color,
        muteRole: nsnowflake,
        banFooter: z.string().max(1024),
        modOnly: z.boolean(),
        allowedRoles: snowflakes,
        blockedRoles: snowflakes,
        allowlistOnly: z.boolean(),
        allowedChannels: snowflakes,
        blockedChannels: snowflakes,
    }) satisfies z.ZodType<DbSettings>,
    "modules-permissions": z.object({
        modules: z.record(z.object({ enabled: z.boolean() })),
        commands: z.record(
            z.object({
                enabled: z.boolean(),
                ignoreDefaultPermissions: z.boolean(),
                allowedRoles: snowflakes,
                blockedRoles: snowflakes,
                restrictChannels: z.boolean(),
                allowedChannels: snowflakes,
                blockedChannels: snowflakes,
            }),
        ),
    }) satisfies z.ZodType<DbModulesPermissionsSettings>,
    logging: z.object({
        useWebhook: z.boolean(),
        defaultChannel: nsnowflake,
        defaultWebhook: z.string(),
        ignoredChannels: snowflakes,
        filesOnly: z.boolean(),
        categories: z.record(
            z.object({
                enabled: z.boolean(),
                useWebhook: z.boolean(),
                outputChannel: nsnowflake,
                outputWebhook: z.string(),
                events: z.record(
                    z.object({
                        enabled: z.boolean(),
                        useWebhook: z.boolean(),
                        outputChannel: nsnowflake,
                        outputWebhook: z.string(),
                    }),
                ),
            }),
        ),
    }) satisfies z.ZodType<DbLoggingSettings>,
    welcome: z.object({
        channel: nsnowflake,
        message,
    }) satisfies z.ZodType<DbWelcomeSettings>,
    "supporter-announcements": z.object({
        entries: z.array(
            z.object({
                channel: nsnowflake,
                boosts: z.boolean(),
                role: nsnowflake,
                message,
            }),
        ),
    }) satisfies z.ZodType<DbSupporterAnnouncementsSettings>,
    xp: z.object({
        blockedChannels: snowflakes,
        blockedRoles: snowflakes,
        bonusChannels: z.array(z.object({ channel: nsnowflake, multiplier: z.nullable(z.number().min(0).max(10)) })),
        bonusRoles: z.array(z.object({ role: nsnowflake, multiplier: z.nullable(z.number().min(0).max(10)) })),
        rankCardBackground: z.string().trim(),
        announceLevelUp: z.boolean(),
        announceInChannel: z.boolean(),
        announceChannel: nsnowflake,
        announcementBackground: z.string().trim(),
        rewards: z.array(
            z.object({
                text: z.nullable(z.number().int().min(1)),
                voice: z.nullable(z.number().int().min(1)),
                role: nsnowflake,
                removeOnHigher: z.boolean(),
                dmOnReward: z.boolean(),
            }),
        ),
    }) satisfies z.ZodType<DbXpSettings>,
    "reaction-roles": z.object({
        entries: z.array(
            z.object({
                id: z.number().int(),
                name: z.string().trim(),
                addReactionsToExistingMessage: z.boolean(),
                channel: nsnowflake,
                message: nsnowflake,
                url: z.string().trim(),
                style: z.enum(["dropdown", "buttons", "reactions"]),
                type: z.enum(["normal", "unique", "verify", "lock"]),
                dropdownData: z
                    .array(
                        z.object({
                            emoji: z.nullable(z.string()),
                            role: snowflake,
                            label: z.string().trim().max(100),
                            description: z.string().trim().max(100),
                        }),
                    )
                    .max(25),
                buttonData: z
                    .array(
                        z
                            .array(
                                z.object({
                                    emoji: z.nullable(z.string()),
                                    role: snowflake,
                                    color: z.enum(["gray", "blue", "green", "red"]),
                                    label: z.string().trim(),
                                }),
                            )
                            .max(5),
                    )
                    .max(5),
                reactionData: z
                    .array(
                        z.object({
                            emoji: z.string(),
                            role: snowflake,
                        }),
                    )
                    .max(20),
                promptMessage: message,
                error: z.nullable(z.string()),
            }),
        ),
    }) satisfies z.ZodType<DbReactionRolesSettings>,
    starboard: z.object({
        detectEmoji: z.nullable(z.string()),
        defaultChannel: z.nullable(z.string()),
        defaultThreshold: z.nullable(z.number().int().min(2)),
        channels: z.record(
            z.object({
                disable: z.boolean(),
                overrideChannel: z.nullable(z.string()),
                overrideThreshold: z.nullable(z.number().int().min(2)),
            }),
        ),
    }) satisfies z.ZodType<DbStarboardSettings>,
    automod: z.object({
        ignoredChannels: snowflakes,
        ignoredRoles: snowflakes,
        defaultChannel: nsnowflake,
        interactWithWebhooks: z.boolean(),
        rules: z.array(
            z.object({
                id: z.number(),
                enable: z.boolean(),
                name: z.string(),
                type: z.enum([
                    "blocked-terms",
                    "blocked-stickers",
                    "caps-spam",
                    "newline-spam",
                    "repeated-characters",
                    "length-limit",
                    "emoji-spam",
                    "ratelimit",
                    "attachment-spam",
                    "sticker-spam",
                    "link-spam",
                    "invite-links",
                    "link-blocklist",
                    "mention-spam",
                ]),
                blockedTermsData: z.object({ terms: z.array(z.string().regex(/^(\*\S|[^*]).+(\S\*|[^*])$/)).max(1000) }),
                blockedStickersData: z.object({ ids: snowflakes.max(1000) }),
                capsSpamData: z.object({ ratioLimit: z.number().min(40).max(100), limit: z.number().min(1) }),
                newlineSpamData: z.object({ consecutiveLimit: z.number().min(1), totalLimit: z.number().min(1) }),
                repeatedCharactersData: z.object({ consecutiveLimit: z.number().min(2) }),
                lengthLimitData: z.object({ limit: z.number().min(2) }),
                emojiSpamData: z.object({ limit: z.number().min(2), blockAnimatedEmoji: z.boolean() }),
                ratelimitData: z.object({ threshold: z.number().min(2), timeInSeconds: z.number().min(1) }),
                attachmentSpamData: z.object({ threshold: z.number().min(2), timeInSeconds: z.number().min(1) }),
                stickerSpamData: z.object({ threshold: z.number().min(2), timeInSeconds: z.number().min(1) }),
                linkSpamData: z.object({ threshold: z.number().min(2), timeInSeconds: z.number().min(1) }),
                inviteLinksData: z.object({ blockUnknown: z.boolean(), allowed: snowflakes.max(1000), blocked: snowflakes.max(1000) }),
                linkBlocklistData: z.object({ websites: z.array(z.string().regex(/^(?<!\w+:\/\/).+\../)).max(1000) }),
                mentionSpamData: z.object({
                    perMessageLimit: z.number().min(2),
                    totalLimit: z.number().min(1),
                    timeInSeconds: z.number().min(1),
                    blockFailedEveryoneOrHere: z.boolean(),
                }),
                reportToChannel: z.boolean(),
                deleteMessage: z.boolean(),
                notifyAuthor: z.boolean(),
                reportChannel: nsnowflake,
                additionalAction: z.enum(["nothing", "warn", "mute", "timeout", "kick", "ban"]),
                actionDuration: z.number().int().min(0),
                disregardDefaultIgnoredChannels: z.boolean(),
                disregardDefaultIgnoredRoles: z.boolean(),
                onlyWatchEnabledChannels: z.boolean(),
                onlyWatchEnabledRoles: z.boolean(),
                ignoredChannels: snowflakes,
                ignoredRoles: snowflakes,
                watchedChannels: snowflakes,
                watchedRoles: snowflakes,
            }),
        ),
    }) satisfies z.ZodType<DbAutomodSettings>,
    "sticky-roles": z.object({
        exclude: snowflakes,
    }) satisfies z.ZodType<DbStickyRolesSettings>,
    "custom-roles": z.object({
        allowBoosters: z.boolean(),
        allowedRoles: snowflakes,
        anchor: nsnowflake,
    }) satisfies z.ZodType<DbCustomRolesSettings>,
    "stats-channels": z.object({
        channels: z.array(
            z.object({
                channel: nsnowflake,
                format: z.string(),
                parsed: cmstring,
            }),
        ),
    }) satisfies z.ZodType<DbStatsChannelsSettings>,
    autoresponder: z.object({
        onlyInAllowedChannels: z.boolean(),
        onlyToAllowedRoles: z.boolean(),
        allowedChannels: snowflakes,
        allowedRoles: snowflakes,
        blockedChannels: snowflakes,
        blockedRoles: snowflakes,
        triggers: z.array(
            z.object({
                enabled: z.boolean(),
                match: z.string().trim().min(1),
                wildcard: z.boolean(),
                caseInsensitive: z.boolean(),
                respondToBotsAndWebhooks: z.boolean(),
                replyMode: z.enum(["normal", "reply", "ping-reply"]),
                reaction: z.nullable(z.string()),
                message,
                bypassDefaultChannelSettings: z.boolean(),
                bypassDefaultRoleSettings: z.boolean(),
                onlyInAllowedChannels: z.boolean(),
                onlyToAllowedRoles: z.boolean(),
                allowedChannels: snowflakes,
                allowedRoles: snowflakes,
                blockedChannels: snowflakes,
                blockedRoles: snowflakes,
            }),
        ),
    }) satisfies z.ZodType<DbAutoresponderSettings>,
    modmail: z.object({
        multi: z.boolean(),
        snippets: z.array(z.object({ name: z.string(), content: z.string(), parsed: cmstring })),
        targets: z.array(
            z.object({
                id: z.number(),
                name: z.string().trim().min(1).max(100),
                description: z.string().trim().max(100),
                emoji: z.nullable(z.string()),
                logChannel: nsnowflake,
                category: nsnowflake,
                pingRoles: snowflakes,
                pingHere: z.boolean(),
                useThreads: z.boolean(),
                accessRoles: snowflakes,
                openMessage: z.string(),
                closeMessage: z.string(),
                openMessageParsed: cmstring,
                closeMessageParsed: cmstring,
            }),
        ),
    }) satisfies z.ZodType<DbModmailSettings>,
    tickets: z.object({
        prompts: z.array(
            z.object({
                id: z.number().int(),
                name: z.string(),
                channel: nsnowflake,
                message: nsnowflake,
                prompt: message,
                multi: z.boolean(),
                targets: z.array(
                    z.object({
                        id: z.number(),
                        name: z.string().max(100),
                        description: z.string().max(100),
                        logChannel: nsnowflake,
                        category: nsnowflake,
                        accessRoles: snowflakes,
                        buttonColor: z.enum(["gray", "blue", "green", "red"]),
                        emoji: z.nullable(z.string()),
                        label: z.string().max(80),
                        pingRoles: snowflakes,
                        pingHere: z.boolean(),
                        postCustomOpenMessage: z.boolean(),
                        customOpenMessage: message,
                    }),
                ),
                error: z.nullable(z.string()),
            }),
        ),
    }) satisfies z.ZodType<DbTicketsSettings>,
    nukeguard: z.object({
        alertChannel: nsnowflake,
        pingRoles: snowflakes,
        pingHere: z.boolean(),
        exemptedRoles: snowflakes,
        watchChannelsByDefault: z.boolean(),
        ignoredChannels: snowflakes,
        watchedChannels: snowflakes,
        watchRolesByDefault: z.boolean(),
        ignoredRoles: snowflakes,
        watchedRoles: snowflakes,
        watchEmojiByDefault: z.boolean(),
        ignoredEmoji: snowflakes,
        watchedEmoji: snowflakes,
        watchStickersByDefault: z.boolean(),
        ignoredStickers: snowflakes,
        watchedStickers: snowflakes,
        watchSoundsByDefault: z.boolean(),
        ignoredSounds: snowflakes,
        watchedSounds: snowflakes,
        preventWebhookCreation: z.boolean(),
        watchWebhookDeletion: z.boolean(),
        ratelimitEnabled: z.boolean(),
        ratelimitKicks: z.boolean(),
        threshold: z.nullable(z.number().int().min(2)),
        timeInSeconds: z.nullable(z.number().min(1).max(3600)),
        restrictRolesLenientMode: z.boolean(),
        restrictRolesBlockByDefault: z.boolean(),
        restrictRolesAllowedRoles: snowflakes,
        restrictRolesBlockedRoles: snowflakes,
    }) satisfies z.ZodType<DbNukeguardSettings>,
    suggestions: z.object({
        outputChannel: nsnowflake,
        anonymous: z.boolean(),
    }) satisfies z.ZodType<DbSuggestionsSettings>,
    "co-op": z.object({
        worldLevelRoles: z.array(nsnowflake).length(9),
        regionRoles: z.array(nsnowflake).length(4),
        helperRoles: z.array(nsnowflake).length(4),
    }) satisfies z.ZodType<DbCoOpSettings>,
    "reddit-feeds": z.object({
        feeds: z.array(
            z.object({
                subreddit: z.string().trim().min(1),
                channel: nsnowflake,
            }),
        ),
    }) satisfies z.ZodType<DbRedditFeedsSettings>,
    count: z.object({
        channels: z.array(
            z.object({
                id: z.number(),
                channel: nsnowflake,
                interval: z.number().int(),
                next: z.number().int(),
                allowDoubleCounting: z.boolean(),
            }),
        ),
    }) satisfies z.ZodType<DbCountSettings>,
    giveaways: z.object({
        template: giveaway,
        giveaways: z.array(
            giveaway.and(
                z.object({
                    id: z.number().int(),
                    name: z.string().trim().min(1).max(256),
                    deadline: z.number(),
                    messageId: nsnowflake,
                    error: z.nullable(z.string()),
                    closed: z.boolean(),
                }),
            ),
        ),
    }) satisfies z.ZodType<DbGiveawaysSettings>,
};
