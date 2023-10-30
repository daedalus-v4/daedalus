import { connect } from "shared";
import "./api";
import { getClientFromToken } from "./bot/clients.js";
import { log } from "./lib/log.js";

process.on("uncaughtException", (e) => log.fatal(e));

await connect();
await getClientFromToken(Bun.env.TOKEN!);
