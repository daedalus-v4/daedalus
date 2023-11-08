import type {
    CustomMessageComponent,
    CustomMessageText,
    DbLoggingSettings,
    DbModulesPermissionsSettings,
    DbReactionRolesSettings,
    DbSettings,
    DbSupporterAnnouncementsSettings,
    DbWelcomeSettings,
    DbXpSettings,
    MessageData,
} from "shared";
import { z } from "zod";

const color = z.number().int().min(0).max(0xffffff);
const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/, "Expected a Discord ID (17-20 digit number).");
const snowflakes = z.array(snowflake);

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

export default {
    "-": z.object({
        dashboardPermissions: z.enum(["owner", "admin", "manager"]),
        embedColor: color,
        muteRole: z.nullable(snowflake),
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
        defaultChannel: z.nullable(snowflake),
        defaultWebhook: z.string(),
        ignoredChannels: snowflakes,
        filesOnly: z.boolean(),
        categories: z.record(
            z.object({
                enabled: z.boolean(),
                useWebhook: z.boolean(),
                outputChannel: z.nullable(snowflake),
                outputWebhook: z.string(),
                events: z.record(
                    z.object({
                        enabled: z.boolean(),
                        useWebhook: z.boolean(),
                        outputChannel: z.nullable(snowflake),
                        outputWebhook: z.string(),
                    }),
                ),
            }),
        ),
    }) satisfies z.ZodType<DbLoggingSettings>,
    welcome: z.object({
        channel: z.nullable(snowflake),
        message,
    }) satisfies z.ZodType<DbWelcomeSettings>,
    "supporter-announcements": z.object({
        entries: z.array(
            z.object({
                channel: z.nullable(snowflake),
                boosts: z.boolean(),
                role: z.nullable(snowflake),
                message,
            }),
        ),
    }) satisfies z.ZodType<DbSupporterAnnouncementsSettings>,
    xp: z.object({
        blockedChannels: snowflakes,
        blockedRoles: snowflakes,
        bonusChannels: z.array(z.object({ channel: z.nullable(snowflake), multiplier: z.nullable(z.number().min(0).max(10)) })),
        bonusRoles: z.array(z.object({ role: z.nullable(snowflake), multiplier: z.nullable(z.number().min(0).max(10)) })),
        rankCardBackground: z.string().trim(),
        announceLevelUp: z.boolean(),
        announceInChannel: z.boolean(),
        announceChannel: z.nullable(snowflake),
        announcementBackground: z.string().trim(),
        rewards: z.array(
            z.object({
                text: z.nullable(z.number().int().min(1)),
                voice: z.nullable(z.number().int().min(1)),
                role: z.nullable(snowflake),
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
                channel: z.nullable(snowflake),
                message: z.nullable(snowflake),
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
};
