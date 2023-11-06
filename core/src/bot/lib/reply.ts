import { InteractionEditReplyOptions, InteractionReplyOptions, RepliableInteraction } from "discord.js";

export default async function (interaction: RepliableInteraction, message: (InteractionEditReplyOptions & InteractionReplyOptions) | string) {
    if (interaction.replied) return await interaction.followUp(message);
    else if (interaction.deferred) return await interaction.editReply(message);
    else return await interaction.reply(message);
}
