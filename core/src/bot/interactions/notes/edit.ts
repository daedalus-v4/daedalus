import { ModalSubmitInteraction } from "discord.js";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";
import { enforcePermissions } from "../../lib/permissions.js";

export default async function (cmd: ModalSubmitInteraction, user: string) {
    await enforcePermissions(cmd.user, "notes", cmd.channel!);

    const notes = cmd.fields.getTextInputValue("notes");
    await db.userNotes.updateOne({ guild: cmd.guild!.id, user }, { $set: { notes } }, { upsert: true });
    return template.success(`<@${user}>'s mod notes were ${notes ? `updated:\n\n${notes}` : "cleared"}`);
}
