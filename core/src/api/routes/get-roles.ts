import { t } from "elysia";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.get(
        "/roles/:guild/:user",
        async ({ params: { guild: guildId, user } }) => {
            try {
                const bot = await getClient(guildId);
                const guild = await bot.guilds.fetch(guildId);
                const member = await guild.members.fetch({ user, force: true });

                return { owner: member.id === guild.ownerId, roles: [...member.roles.cache.keys()] };
            } catch {
                return { owner: false, roles: [] };
            }
        },
        {
            params: t.Object({
                guild: t.String(),
                user: t.String(),
            }),
            response: t.Object({
                owner: t.Boolean(),
                roles: t.Array(t.String()),
            }),
        },
    );
