import type {
    CustomMessageComponent,
    CustomMessageText,
    DbLoggingSettings,
    DbModulesPermissionsSettings,
    DbSettings,
    DbWelcomeSettings,
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
    welcome: z.object({
        channel: z.nullable(snowflake),
        message,
    }) satisfies z.ZodType<DbWelcomeSettings>,
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
};
