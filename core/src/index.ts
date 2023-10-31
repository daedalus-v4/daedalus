import { connect } from "shared/db.js";
import "./api";
import { getClientFromToken } from "./bot/clients.js";
import { log } from "./lib/log.js";

process.on("uncaughtException", (e) => log.fatal(e));

await connect(Bun.env.DB_URI!, Bun.env.DB_NAME!);
await getClientFromToken(Bun.env.TOKEN!);
