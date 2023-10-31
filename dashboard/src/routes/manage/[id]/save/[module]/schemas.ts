import { z } from "zod";

const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/, "Expected a Discord ID (17-20 digit number).");
const snowflakes = z.array(snowflake);

export default {
    "-": z.object({
        dashboardPermissions: z.enum(["owner", "admin", "manager"]),
        embedColor: z.number().min(0).max(0xffffff),
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
};
