import { ButtonInteraction } from "discord.js";
import { check } from "../../lib/permissions.js";

export default async function (button: ButtonInteraction) {
    const block = await check(button.user, "poll", button.channel!);
    if (block) throw block;

    await button.update({
        components: button.message.components.map((row) => ({
            type: row.type,
            components: row.components.map((x) => ({
                ...x.toJSON(),
                ...(x.customId === "::poll/open" ? { customId: "::poll/close", label: "Close" } : { disabled: false }),
            })),
        })),
    });
}
