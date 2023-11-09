import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";
import { enforcePermissions } from "../../lib/permissions.js";

export default async function (cmd: ButtonInteraction, user: string) {
    await cmd.update({ components: [] });

    await enforcePermissions(cmd.user, "notes", cmd.channel!);

    const { notes } = (await db.userNotes.findOne({ guild: cmd.guild!.id, user })) ?? {};
    if (!notes) return template.error(`<@${user}> does not have any mod notes.`);

    return template.info(`Mod notes for <@${user}>:\n\n${notes}`, false);
}
