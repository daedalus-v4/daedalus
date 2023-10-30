import { getAllClients } from "core/src/bot/clients.js";
import { App } from "../app.js";

export default (app: App) =>
    app.get("/guild-count", async () => {
        return getAllClients()
            .map((client) => client.guilds.cache.size)
            .reduce((x, y) => x + y);
    });
