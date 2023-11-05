import { t } from "elysia";
import { assignClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.post(
        "/assign-client",
        async ({ body: { guild, token } }) => {
            return JSON.stringify((await assignClient(guild, token)) ?? null);
        },
        {
            body: t.Object({
                guild: t.String(),
                token: t.String(),
            }),
            response: t.Nullable(t.String()),
        },
    );
