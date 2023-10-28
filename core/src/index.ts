import { connect, log } from "shared";
import { getClientFromToken } from "./bot/clients.js";

process.on("uncaughtException", (e) => log.fatal(e));

await connect();
await getClientFromToken(Bun.env.TOKEN!);
