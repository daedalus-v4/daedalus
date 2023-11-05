import Argentium from "argentium";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { autoIncrement } from "shared/db.js";
import { log } from "../lib/log.js";
import { getClient } from "../lib/premium.js";
import { template } from "./lib/format.js";

export default new Argentium()
    .use((x) =>
        readdirSync(path.join(__dirname, "modules"))
            .filter((x) => existsSync(path.join(__dirname, "modules", x, "index.ts")))
            .reduce((x, y) => x.use(require(`./modules/${y}`).default), x),
    )
    .beforeAllCommands(async ({ _ }, escape) => {
        if (_.guild && !(_.isChatInputCommand() && _.commandName === "admin") && _.client.token !== (await getClient(_.guild)).token)
            escape(template.error("Incorrect client in use; please use this guild's bot."));

        log.info(
            `${
                _.isChatInputCommand()
                    ? `/${[_.commandName, _.options.getSubcommandGroup(false), _.options.getSubcommand(false)].filter((x) => x).join(" ")}`
                    : _.commandName
            } (${_.user.tag} (${_.user.id}) in ${_.guild ? `${_.guild.name} (${_.guild.id})` : "DMs"})`,
        );
    })
    .onCommandError(async (e) => {
        if (typeof e === "string") return template.error(e);

        e.id = await autoIncrement("unexpected-errors");
        log.error(e, "8a282b5e-0d0c-4ad1-9277-0f667ec00d88");

        return template.error(`An unexpected error occurred. If contacting support, please mention the error ID **\`${e.id}\`**.`);
    });
