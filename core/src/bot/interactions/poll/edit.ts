import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";
import { renderPoll } from "../../modules/polls/lib.js";

export default async function (button: ButtonInteraction) {
    const poll = await db.polls.findOne({ message: button.message.id });
    if (!poll) throw "Unexpected error: poll not found for this message.";

    await button.showModal({
        title: "Editing Poll (30 minutes to fill out)",
        customId: "edit-poll",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "question",
                        label: "Question",
                        required: true,
                        maxLength: 1024,
                        value: poll.question,
                    },
                ],
            },
        ],
    });

    const modal = await button.awaitModalSubmit({ time: 30 * 60 * 1000 }).catch(() => {});
    if (!modal) return;

    await modal.deferReply({ ephemeral: true });

    const question = modal.fields.getTextInputValue("question");
    await db.polls.updateOne({ _id: poll._id }, { $set: { question } });

    await button.message.edit(await renderPoll((await db.polls.findOne({ message: button.message.id }))!, button.guild!));
    await modal.editReply(template.success("Your poll has been edited."));
}
