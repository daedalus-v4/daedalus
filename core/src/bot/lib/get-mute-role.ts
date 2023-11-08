import { Guild } from "discord.js";
import { db } from "shared/db.js";

export default async function getMuteRole(guild: Guild) {
    const { muteRole } = (await db.guildSettings.findOne({ guild: guild.id })) ?? {};
    if (!muteRole) return;

    try {
        return await guild.roles.fetch(muteRole, { force: true });
    } catch {
        await db.guildSettings.updateOne({ guild: guild.id }, { $unset: { muteRole: 1 } });
    }
}

export async function getMuteRoleWithAsserts(guild: Guild) {
    const role = await getMuteRole(guild);

    if (!role) throw `This server does not have a mute role set up. You can set it in the Server Settings menu on the [dashboard](${Bun.env.DOMAIN}).`;
    if (guild.members.me!.roles.highest.comparePositionTo(role) <= 0)
        throw `${role} is higher than or equal to the bot's highest role, so it cannot be managed.`;

    return role;
}
