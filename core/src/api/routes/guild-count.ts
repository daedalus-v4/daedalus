import { getAllClients } from "../../bot/clients.js";
import { App } from "../app.js";

export default (app: App) =>
    app.get("/guild-count", async () => {
        return new Set(getAllClients().flatMap((client) => [...client.guilds.cache.keys()])).size;
    });
