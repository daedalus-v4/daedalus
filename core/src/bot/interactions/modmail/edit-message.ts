import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import { getModmailContactInfo } from "../../modules/modmail/lib.js";

export default async function (button: ButtonInteraction, _source: string) {
    const { thread } = await getModmailContactInfo(false)({ _: button });

    const source = parseInt(_source);

    const message = thread.messages.find((x) => x.type === "outgoing" && x.source === source);
    if (message?.type !== "outgoing") throw "This message could not be found in this modmail thread as an outgoing message.";

    await button.showModal({
        title: "Edit Modmail Message",
        customId: `:modmail/save:${source}`,
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
