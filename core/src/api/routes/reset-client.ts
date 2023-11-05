import { t } from "elysia";
import { resetClient } from "../../lib/premium.js";
import { App } from "../app.js";

export default (app: App) =>
    app.post(
        "/reset-client",
        async ({ body: { guild } }) => {
            await resetClient(guild);
            return true;
        },
        {
            body: t.Object({ guild: t.String() }),
            response: t.Boolean(),
        },
    );
