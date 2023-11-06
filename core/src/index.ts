import { connect, db } from "shared/db.js";
import "./api";
import { getClientFromToken } from "./bot/clients.js";
import "./lib/global-tasks.js";
import { log } from "./lib/log.js";
import { getClient } from "./lib/premium.js";

process.on("uncaughtException", (e) => log.fatal(e));

await connect(Bun.env.DB_URI!, Bun.env.DB_NAME!);
await getClientFromToken(Bun.env.TOKEN!);

for await (const { guild } of db.guildSettings.find()) await getClient(guild);
