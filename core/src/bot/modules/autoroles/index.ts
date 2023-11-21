import Argentium from "argentium";
import { Events } from "discord.js";
import { db } from "shared/db.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app.on(Events.GuildMemberAdd, async (member) => {
        if (await skip(member.guild, "autoroles")) return;

        const settings = await db.autorolesSettings.findOne({ guild: member.guild.id });
        if (!settings?.roles.length) return;

        await member.roles.add(settings.roles, "added by autoroles module");
    });
