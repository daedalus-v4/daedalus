import { z } from "zod";

const color = z.number().int().min(0).max(0xffffff);
const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/, "Expected a Discord ID (17-20 digit number).");
const snowflakes = z.array(snowflake);

const message = z.object({
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
    }),
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
    }),
    welcome: z.object({
        channel: z.nullable(snowflake),
        message,
    }),
};
