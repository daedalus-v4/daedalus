import { connect, db } from "shared/db.js";

await connect(Bun.env.DB_URI!, Bun.env.DB_NAME!);

import "./api";
import { getClientFromToken } from "./bot/clients.js";
import "./lib/global-tasks.js";
import { log } from "./lib/log.js";
import { getTokens } from "./lib/premium.js";

process.on("uncaughtException", (e) => log.fatal(e));

await getClientFromToken(Bun.env.TOKEN!);

const guilds = (await db.guildSettings.find().toArray()).map((x) => x.guild);
const tokens = new Set(await getTokens(guilds));

for (const token of tokens) await getClientFromToken(token).catch(() => {});
