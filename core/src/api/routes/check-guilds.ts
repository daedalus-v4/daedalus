import { PermissionFlagsBits } from "discord.js";
import { t } from "elysia";
import { DDLGuild, DbSettings } from "shared";
import { db } from "shared/db.js";
import { getAllClients } from "../../bot/clients.js";
import { getClients } from "../../lib/premium.js";
import { App } from "../app.js";
import { guildSchema } from "../schemas.js";

export default (app: App) =>
    app.post(
        "/check-guilds",
        async ({ body }) => {
            const { guilds: data, user } = body;

            const owner = user === Bun.env.OWNER;

            const output: DDLGuild[] = [];
            const ids = new Set(data.map((x) => x.id));

            const settings = owner ? {} : Object.fromEntries((await db.guildSettings.find().toArray()).map((x) => [x.guild, x]));
            const clients = await getClients(data.map((x) => x.id));

            const fetched = new Set<string>();

            for (let index = 0; index < data.length; index++) {
                const guild = data[index];
                if (!(await canAccess(settings, guild, owner))) continue;

                const client = clients[index];
                if (!fetched.has(client.token!)) {
                    fetched.add(client.token!);
                    await client.guilds.fetch();
                }

                output.push({ ...guild, hasBot: client.guilds.cache.has(guild.id) });
            }

            if (owner)
                for (const client of getAllClients())
                    for (const [id, guild] of await client.guilds.fetch())
                        if (!ids.has(id))
                            output.push({
                                id,
                                name: guild.name,
                                icon: guild.icon,
                                owner: false,
                                permissions: "0",
                                features: guild.features,
                                hasBot: true,
                                notIn: true,
                            });

            return output;
        },
        { body: t.Object({ user: t.String(), guilds: t.Array(guildSchema) }) },
    );

async function canAccess(settings: Record<string, DbSettings>, guild: DDLGuild, owner: boolean) {
    if (owner || guild.owner) return true;

    const permissions = BigInt(guild.permissions);

    if (settings[guild.id]?.dashboardPermissions === "admin") return (permissions & PermissionFlagsBits.Administrator) > 0n;
    else if (settings[guild.id]?.dashboardPermissions === "owner") return false;
    else return (permissions & (PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild)) > 0n;
}
