import { Message, ModalSubmitInteraction } from "discord.js";
import { db } from "shared/db.js";
import { colors } from "../../lib/format.js";
import { getModmailContactInfo } from "../../modules/modmail/lib.js";

export default async function (modal: ModalSubmitInteraction, _id: string) {
    const { member, thread } = await getModmailContactInfo(false)({ _: modal });

    await modal.deferReply();
    const id = parseInt(_id);

    const index = thread.messages.findIndex((x) => x.type === "outgoing" && x.id === id);
    if (index === -1) throw "This message could not be found in this modmail thread as an outgoing message.";

    const data = thread.messages[index];
    if (data.type !== "outgoing") throw "?";

    let message: Message;

    try {
        message = await (await member.createDM()).messages.fetch(data.message);
        if (!message) throw 0;
    } catch {
        throw "Failed to fetch the corresponding outgoing message.";
    }

    const description = modal.fields.getTextInputValue("message");

    await message.edit({ embeds: [{ ...message.embeds[0].toJSON(), description }] });
    await db.modmailThreads.updateOne({ channel: modal.channel!.id }, { $push: { [`messages.${index}.edits`]: description } });

    return { embeds: [{ title: "Outgoing Message Edited", description, color: colors.statuses.success }] };
}
