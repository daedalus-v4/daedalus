import { App } from "./app.js";
import checkGuild from "./routes/check-guild.js";
import checkGuilds from "./routes/check-guilds.js";
import guildCount from "./routes/guild-count.js";

export default (app: App) => app.use(checkGuild).use(checkGuilds).use(guildCount);
