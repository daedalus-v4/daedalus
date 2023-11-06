import { ButtonInteraction, ButtonStyle, ComponentType } from "discord.js";

export default async function (button: ButtonInteraction) {
    await button.update({
        components: [
            {
                type: ComponentType.ActionRow,
                components: [{ type: ComponentType.Button, customId: "-", style: ButtonStyle.Secondary, label: "Action Canceled", disabled: true }],
            },
        ],
    });
}
