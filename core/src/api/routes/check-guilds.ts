import { getAllClients } from "core/src/bot/clients.js";
import { getClient } from "core/src/lib/premium.js";
import { PermissionFlagsBits } from "discord.js";
import { t } from "elysia";
import { db } from "shared/db.js";
import { App } from "../app.js";

const guildSchema = t.Object({
    id: t.String(),
    name: t.String(),
    icon: t.Nullable(t.String()),
    owner: t.Boolean(),
    permissions: t.String(),
    features: t.Array(t.String()),
});

interface IGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    features: string[];
    notIn?: boolean;
}

export default (app: App) =>
    app.post(
        "/check-guilds",
        async ({ body }) => {
            const { guilds: data, user } = body;

            const owner = user === Bun.env.OWNER;

            const output: IGuild[] = [];
            const ids = new Set(data.map((x) => x.id));

            for (const guild of data) {
                if (!(await canAccess(guild, owner))) continue;

                try {
                    const client = await getClient(guild.id);
                    await client.guilds.fetch(guild.id);
                    output.push({ ...guild, hasBot: true });
                } catch {
                    output.push({ ...guild, hasBot: false });
                }
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

async function canAccess(guild: IGuild, owner: boolean) {
    if (owner || guild.owner) return true;

    const settings = await db.guildSettings.findOne({ guild: guild.id });
    const permissions = BigInt(guild.permissions);

    if (settings?.dashboardPermissions === "admin") return (permissions & PermissionFlagsBits.Administrator) > 0n;
    else if (settings?.dashboardPermissions === "owner") return false;
    else return (permissions & (PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild)) > 0n;
}
