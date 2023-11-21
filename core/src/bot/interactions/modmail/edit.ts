import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import { getModmailContactInfo } from "../../modules/modmail/lib.js";

export default async function (button: ButtonInteraction) {
    const { thread } = await getModmailContactInfo(false)({ _: button });

    const message = thread.messages.find((x) => x.type === "outgoing" && x.source === button.message.id);
    if (message?.type !== "outgoing") throw "This message could not be found.";

    await button.showModal({
        title: "Edit Modmail Message",
        customId: `:modmail/save:${message.source}`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "message",
                        label: "Message",
                        maxLength: 2000,
                        value: message.content,
                        required: button.message.attachments.size === 0,
                    },
                ],
            },
        ],
    });
}
