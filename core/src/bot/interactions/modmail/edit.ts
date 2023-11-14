import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import { getModmailContactInfo } from "../../modules/modmail/lib.js";

export default async function (button: ButtonInteraction, _id: string) {
    const { thread } = await getModmailContactInfo(false)({ _: button });
    const id = parseInt(_id);

    await button.showModal({
        title: "Edit Modmail Message",
        customId: `:modmail/save:${id}`,
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
                        value: thread.messages.map((x) => (x.type === "outgoing" && x.id === id ? x.content : "")).find((x) => x),
                        required: button.message.attachments.size === 0,
                    },
                ],
            },
        ],
    });
}
