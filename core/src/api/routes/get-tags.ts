import { t } from "elysia";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.get(
        "/tags/:users",
        async ({ params: { users } }) => {
            const client = await getClient();

            return Object.fromEntries(
                await Promise.all(users.split(":").map(async (id) => [id, (await client.users.fetch(id).catch(() => ({ tag: "Invalid User" }))).tag])),
            );
        },
        {
            params: t.Object({
                users: t.String(),
            }),
            response: t.Record(t.String(), t.String()),
        },
    );
