import { t } from "elysia";
import { resetClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.post(
        "/reset-client",
        async ({ body: { guilds } }) => {
            for (const guild of guilds) await resetClient(guild);
            return true;
        },
        {
            body: t.Object({ guilds: t.Array(t.String()) }),
            response: t.Boolean(),
        },
    );
