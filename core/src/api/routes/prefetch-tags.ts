import { t } from "elysia";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.get(
        "/prefetch-tags/:users",
        async ({ params: { users } }) => {
            const client = await getClient();
            return Object.fromEntries(
                users
                    .split(":")
                    .map((id) => [id, client.users.cache.get(id)?.tag])
                    .filter(([, v]) => v),
            );
        },
        {
            params: t.Object({
                users: t.String(),
            }),
            response: t.Record(t.String(), t.String()),
        },
    );
