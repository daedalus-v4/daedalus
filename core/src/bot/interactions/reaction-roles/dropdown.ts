import { StringSelectMenuInteraction } from "discord.js";
import { db, getLimitFor } from "shared/db.js";
import { englishList, template } from "../../lib/format.js";

export default async function (cmd: StringSelectMenuInteraction) {
    const doc = await db.reactionRolesSettings.findOne({ guild: cmd.guild!.id });
    if (!doc) return;

    const entry = doc.entries.slice(0, await getLimitFor(cmd.guild!, "reactionRolesCount")).find((entry) => entry.message === cmd.message.id);

    if (entry?.error)
        return template.error(`This reaction role prompt is out of sync due to an error with its last save. Server management can fix this on the dashboard.`);

    if (entry?.style !== "dropdown") return;

    const roles = entry.dropdownData.map((x) => x.role!);
    const add = cmd.values.map((x) => roles[+x]);
    const remove = roles.filter((x) => !add.includes(x));
    const member = await cmd.guild!.members.fetch(cmd.user.id);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles))
            return template.error(`You already have one of these roles, and it is locked, so you cannot remove or change it.`);
        await member.roles.add([...new Set(add)]);
        return template.success(`Locked in <@&${add[0]}>.`);
    } else if (entry.type === "normal" || entry.type === "unique") {
        await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), ...add])]);

        if (add.length === 0) return template.success(`Removed all of your roles from this prompt.`);
        else return template.success(`Set your selected role${add.length === 1 ? "" : "s"} to ${englishList(add.map((x) => `<@&${x}>`))}.`);
    } else if (entry.type === "verify") {
        if (add.length === 0) return template.success(`No roles were added.`);

        await member.roles.add([...new Set(add)]);
        return template.success(`Added ${englishList(add.map((x) => `<@&${x}>`))}.`);
    }
}
