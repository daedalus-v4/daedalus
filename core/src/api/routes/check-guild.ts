import { Guild, PermissionFlagsBits } from "discord.js";
import { t } from "elysia";
import { TFChannel, TFRole } from "shared";
import { db } from "shared/db.js";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

const invalid = { valid: false, roles: [], channels: [] };

export default (app: App) =>
    app.post(
        "/check-guild",
        async ({ body }) => {
            const { guild: id, user } = body;

            let guild: Guild;

            try {
                guild = await (await getClient(id)).guilds.fetch(id);
            } catch {
                return invalid;
            }

            if (user !== Bun.env.OWNER && user !== guild.ownerId) {
                const settings = await db.guildSettings.findOne({ guild: id });

                if (settings?.dashboardPermissions === "owner") return invalid;

                try {
                    const member = await guild.members.fetch(user);
                    if (!member) return invalid;

                    if (
                        !(
                            member.permissions.has(PermissionFlagsBits.Administrator) ||
                            (settings?.dashboardPermissions !== "admin" && member.permissions.has(PermissionFlagsBits.ManageGuild))
                        )
                    )
                        return invalid;
                } catch {
                    return invalid;
                }
            }

            const me = await guild.members.fetchMe();

            return {
                valid: true,
                roles: guild.roles.cache
                    .sort((x, y) => -x.comparePositionTo(y))
                    .map((role) => {
                        const output: TFRole = {
                            id: role.id,
                            name: role.name,
                            color: role.color,
                        };

                        if (role.id === guild.roles.everyone.id) output.everyone = true;
                        if (role.managed) output.managed = true;
                        if (role.comparePositionTo(me.roles.highest) >= 0) output.higher = true;

                        return output;
                    }),
                channels: guild.channels.cache.map((channel) => {
                    const output: TFChannel = {
                        id: channel.id,
                        type: channel.type,
                        position: "position" in channel ? channel.position : 0,
                        name: channel.name,
                    };

                    if (channel.parentId) output.parent = channel.parentId;
                    if (!channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)) output.readonly = true;

                    return output;
                }),
            };
        },
        {
            body: t.Object({
                user: t.String(),
                guild: t.String(),
            }),
            response: t.Object({
                valid: t.Boolean(),
                roles: t.Array(
                    t.Object({
                        id: t.String(),
                        name: t.String(),
                        color: t.Integer({ minimum: 0, maximum: 0xffffff }),
                        everyone: t.Optional(t.Boolean()),
                        managed: t.Optional(t.Boolean()),
                        higher: t.Optional(t.Boolean()),
                    }),
                ),
                channels: t.Array(
                    t.Object({
                        id: t.String(),
                        type: t.Integer(),
                        position: t.Integer(),
                        name: t.String(),
                        parent: t.Optional(t.String()),
                        readonly: t.Optional(t.Boolean()),
                    }),
                ),
            }),
        },
    );
