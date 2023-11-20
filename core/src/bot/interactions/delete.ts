import { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await button.message.delete();
}
