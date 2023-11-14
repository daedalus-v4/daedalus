import { ButtonInteraction, ButtonStyle, ComponentType, Message } from "discord.js";
import { db } from "shared/db.js";
import { colors, template } from "../../lib/format.js";
import { getModmailContactInfo } from "../../modules/modmail/lib.js";

export default async function (button: ButtonInteraction, _id: string) {
    const { member, thread } = await getModmailContactInfo(false)({ _: button });

    const reply = await button.reply({
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, style: ButtonStyle.Danger, customId: "confirm", label: "Delete" },
                    { type: ComponentType.Button, style: ButtonStyle.Secondary, customId: "cancel", label: "Cancel" },
                ],
            },
        ],
        fetchReply: true,
    });

    const response = await reply
        .awaitMessageComponent({ componentType: ComponentType.Button, filter: (x) => x.user.id === button.user.id, time: 300000 })
        .catch(() => {});

    if (!response)
        return void (await reply.edit({
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "Confirmation Timed Out", disabled: true }],
                },
            ],
        }));

    if (response.customId === "cancel")
        return void (await response.update({
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "Deletion Canceled", disabled: true }],
                },
            ],
        }));

    await response.deferUpdate();
    const id = parseInt(_id);

    const index = thread.messages.findIndex((x) => x.type === "outgoing" && x.id === id);

    if (index === -1) return void (await response.editReply(template.error("This message could not be found in this modmail thread as an outgoing message.")));

    const data = thread.messages[index];
    if (data.type !== "outgoing") throw "?";

    let message: Message;

    try {
        message = await (await member.createDM()).messages.fetch(data.message);
    } catch {
        return void (await response.editReply(template.error("Failed to fetch the corresponding outgoing message.")));
    }

    await message.edit({
        embeds: [
            {
                title: `Incoming Message Deleted (${button.guild!.name})`,
                description: "A modmail message was sent to you but later deleted.",
                color: colors.prompts.canceled,
            },
        ],
        files: [],
    });

    await db.modmailThreads.updateOne({ channel: button.channel!.id }, { $set: { [`messages.${index}.deleted`]: true } });
    await response.editReply({ embeds: [{ title: "Outgoing Message Deleted", color: colors.statuses.success }], components: [] });
}
