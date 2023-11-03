import { Guild } from "discord.js";
import { db } from "shared/db.js";

export default async function (guild: Guild) {
    const { muteRole } = (await db.guildSettings.findOne({ guild: guild.id })) ?? {};
    if (!muteRole) return;

    try {
        return await guild.roles.fetch(muteRole, { force: true });
    } catch {
        await db.guildSettings.updateOne({ guild: guild.id }, { $unset: { muteRole: 1 } });
    }
}
