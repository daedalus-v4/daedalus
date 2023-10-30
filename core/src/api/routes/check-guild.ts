import { Guild, PermissionFlagsBits } from "discord.js";
import { t } from "elysia";
import { db } from "shared/db.js";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.post(
        "/check-guild",
        async ({ body }) => {
            const { guild: id, user } = body;

            let guild: Guild;

            try {
                guild = await (await getClient(id)).guilds.fetch(id);
            } catch {
                return false;
            }

            if (user === Bun.env.OWNER || user === guild.ownerId) return true;

            const settings = await db.guildSettings.findOne({ guild: id });

            if (settings?.dashboardPermissions === "owner") return false;

            try {
                const member = await guild.members.fetch(user);
                if (!member) return false;

                return (
                    member.permissions.has(PermissionFlagsBits.Administrator) ||
                    (settings?.dashboardPermissions !== "admin" && member.permissions.has(PermissionFlagsBits.ManageGuild))
                );
            } catch {
                return false;
            }
        },
        { body: t.Object({ user: t.String(), guild: t.String() }) },
    );
