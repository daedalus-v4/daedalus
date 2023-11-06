import Argentium from "argentium";
import { Events } from "discord.js";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { autoIncrement } from "shared/db.js";
import { log } from "../lib/log.js";
import { getClient } from "../lib/premium.js";
import { template } from "./lib/format.js";
import { check } from "./lib/permissions.js";
import reply from "./lib/reply.js";

export default new Argentium()
    .use((x) =>
        readdirSync(path.join(__dirname, "modules"))
            .filter((x) => existsSync(path.join(__dirname, "modules", x, "index.ts")))
            .reduce((x, y) => x.use(require(`./modules/${y}`).default), x),
    )
    .beforeAllCommands(async ({ _ }, escape) => {
        if (_.guild && !(_.isChatInputCommand() && _.commandName === "admin") && _.client.token !== (await getClient(_.guild)).token)
            escape(template.error("Incorrect client in use; please use this guild's bot."));

        if (!_.isChatInputCommand || _.commandName !== "admin") {
            const denyReason = await check(_.user, _.commandName, _.channel!);
            if (denyReason) escape(template.error(denyReason));
        }

        log.info(
            `${
                _.isChatInputCommand()
                    ? `/${[_.commandName, _.options.getSubcommandGroup(false), _.options.getSubcommand(false)].filter((x) => x).join(" ")}`
                    : _.commandName
            } (${_.user.tag} (${_.user.id}) in ${_.guild ? `${_.guild.name} (${_.guild.id})` : "DMs"})`,
        );
    })
    .on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;

        const [_, user, path, ...args] = interaction.isModalSubmit() ? (":" + interaction.customId).split(":") : interaction.customId.split(":");

        if (!path) return;
        if (user && interaction.user.id !== user) return;

        let fn: any;

        try {
            fn = require(`./interactions/${path}.js`).default;
        } catch {
            await interaction.reply(template.error("This interaction is not yet implemented. This is our fault; please contact support."));
            return;
        }

        try {
            const response = await fn(interaction, ...args);
            if (!response) return;

            await reply(interaction, response);
        } catch (e: any) {
            if (typeof e === "string") return void (await reply(interaction, template.error(e)));

            e.errorID = await autoIncrement("unexpected-errors");
            log.error(e, "2ed8f6b5-4f06-4f89-93bf-3202d926b845");

            return void (await reply(
                interaction,
                template.error(`An unexpected error occurred. If contacting support, please mention the error ID **\`${e.errorID}\`**.`),
            ));
        }
    })
    .onCommandError(async (e) => {
        if (typeof e === "string") return template.error(e);

        e.errorID = await autoIncrement("unexpected-errors");
        log.error(e, "8a282b5e-0d0c-4ad1-9277-0f667ec00d88");

        return template.error(`An unexpected error occurred. If contacting support, please mention the error ID **\`${e.errorID}\`**.`);
    });
