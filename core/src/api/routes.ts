import { App } from "./app.js";
import assignClient from "./routes/assign-client.js";
import checkGuild from "./routes/check-guild.js";
import checkGuilds from "./routes/check-guilds.js";
import guildCount from "./routes/guild-count.js";
import resetClient from "./routes/reset-client.js";

export default (app: App) => app.use(assignClient).use(checkGuild).use(checkGuilds).use(guildCount).use(resetClient);
