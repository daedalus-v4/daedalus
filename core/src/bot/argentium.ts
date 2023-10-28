import Argentium from "argentium";
import { Events } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { autoIncrement } from "../lib/db.js";
import log from "../lib/log.js";
import { template } from "./lib/format.js";

export default new Argentium()
    .use((x) => readdirSync(path.join(__dirname, "modules")).reduce((x, y) => x.use(require(`./modules/${y}`).default), x))
    .onCommandError(async (e) => {
        if (typeof e === "string") return template.error(e);

        e.id = await autoIncrement("unexpected-errors");
        e.location = "8a282b5e-0d0c-4ad1-9277-0f667ec00d88";
        log.error(e);

        return template.error(`An unexpected error occurred. If contacting support, please mention the error ID **\`${e.id}\`**.`);
    })
    .on(Events.ClientReady, () => log.info("Bot online."));
