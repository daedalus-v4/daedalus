import Argentium from "argentium";
import { Events } from "discord.js";
import { db } from "shared/db.js";
import { fetchAndSendCustom, skip } from "../utils.js";

export default (app: Argentium) =>
    app.on(Events.GuildMemberAdd, async (member) => {
        if (await skip(member.guild, "welcome")) return;

        const settings = await db.welcomeSettings.findOne({ guild: member.guild.id });
        if (!settings?.channel) return;

        await fetchAndSendCustom(
            member.guild,
            settings.channel,
            "Welcome",
            "welcome",
            settings.message,
            `The welcome message for ${member} could not be sent.`,
            async () => ({ member: await member.fetch() }),
            true,
        );
    });
