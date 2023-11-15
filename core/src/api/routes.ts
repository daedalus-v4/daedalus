import { App } from "./app.js";
import assignClient from "./routes/assign-client.js";
import checkGuild from "./routes/check-guild.js";
import checkGuilds from "./routes/check-guilds.js";
import getRoles from "./routes/get-roles.js";
import getTags from "./routes/get-tags.js";
import guildCount from "./routes/guild-count.js";
import prefetchTags from "./routes/prefetch-tags.js";
import resetClient from "./routes/reset-client.js";

export default (app: App) =>
    app.use(assignClient).use(checkGuild).use(checkGuilds).use(getRoles).use(getTags).use(guildCount).use(prefetchTags).use(resetClient);
