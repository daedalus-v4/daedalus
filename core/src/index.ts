import { connect } from "shared/db.js";
import "./api";
import { getClientFromToken } from "./bot/clients.js";
import { log } from "./lib/log.js";

process.on("uncaughtException", (e) => log.fatal(e));

await connect();
await getClientFromToken(Bun.env.TOKEN!);
