import Argentium from "argentium";
import { Events } from "discord.js";
import { db, isModuleEnabled } from "shared/db.js";

export default (app: Argentium) =>
    app.on(Events.GuildMemberAdd, async (member) => {
        if (!(await isModuleEnabled(member.guild.id, "welcome"))) return;

        const settings = await db.welcomeSettings.findOne({ guild: member.guild.id });
        if (!settings?.channel) return;

        // TODO
    });
