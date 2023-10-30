import { App } from "./app.js";
import checkGuilds from "./routes/check-guilds.js";
import guildCount from "./routes/guild-count.js";

export default (app: App) => app.use(checkGuilds).use(guildCount);
