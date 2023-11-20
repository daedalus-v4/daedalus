import { GuildTextBasedChannel, ModalSubmitInteraction } from "discord.js";
import { db } from "shared/db.js";
import { updateStick } from "../modules/sticky-messages/lib.js";

export default async function (modal: ModalSubmitInteraction, seconds_: string) {
    await modal.deferReply({ ephemeral: true });

    const seconds = parseInt(seconds_);
    const content = modal.fields.getTextInputValue("message");

    await db.stickyMessages.findOneAndUpdate({ guild: modal.guild!.id, channel: modal.channel!.id }, { $set: { content, seconds } }, { upsert: true });

    await updateStick(modal.channel as GuildTextBasedChannel);
    return "Sticky message updated.";
}
