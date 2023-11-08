import { ButtonInteraction } from "discord.js";
import { db, getLimitFor } from "shared/db.js";
import { template } from "../../lib/format.js";

export default async function (cmd: ButtonInteraction, _row: string, _col: string) {
    const row = parseInt(_row);
    const col = parseInt(_col);

    const doc = await db.reactionRolesSettings.findOne({ guild: cmd.guild!.id });
    if (!doc) return;

    const entry = doc.entries.slice(0, await getLimitFor(cmd.guild!, "reactionRolesCount")).find((entry) => entry.message === cmd.message.id);

    if (entry?.error)
        return template.error(`This reaction role prompt is out of sync due to an error with its last save. Server management can fix this on the dashboard.`);

    if (entry?.style !== "buttons") return;
    if (row >= entry.buttonData.length || col >= entry.buttonData[row].length)
        return template.error(
            `Index error: row ${row} col ${col} is not valid for this prompt. Please report this to Daedalus support, not the server's staff.`,
        );

    const roles = entry.buttonData.flatMap((x) => x.map((x) => x.role!));
    const add = entry.buttonData[row][col].role!;
    const remove = roles.filter((x) => x !== add);
    const member = await cmd.guild!.members.fetch(cmd.user.id);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles))
            return template.error(`You already have one of these roles, and it is locked, so you cannot remove or change it.`);
        await member.roles.add(add);
        return template.success(`Locked in <@&${add}>.`);
    } else if (entry.type === "normal" || entry.type === "unique") {
        if (member.roles.cache.has(add)) {
            await member.roles.remove(add);
            return template.success(`Removed <@&${add}>.`);
        } else if (entry.type === "normal") {
            await member.roles.add(add);
            return template.success(`Added <@&${add}>.`);
        } else {
            await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), add])]);
            return template.success(`Set your selected role to <@&${add}>.`);
        }
    } else {
        if (!member.roles.cache.has(add)) await member.roles.add(add);
        return template.success(`Added <@&${add}>.`);
    }
}
