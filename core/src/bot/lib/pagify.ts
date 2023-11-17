import { ButtonStyle, ChatInputCommandInteraction, ComponentType, MessageComponentInteraction } from "discord.js";

export default async function (cmd: ChatInputCommandInteraction, messages: any[], ephemeral?: boolean, initial?: number) {
    const reply = async (x: any) => {
        if (cmd.deferred || cmd.replied) return await cmd.editReply(x);
        else return await cmd.reply(x);
    };

    if (messages.length === 0) throw "Attempted to return pages, but there was nothing found.";

    if (messages.length === 1) return await reply({ ...messages[0], ephemeral });

    let page = initial ?? 0;

    messages.forEach((message, index) => {
        if (message?.embeds?.length)
            message.embeds[message.embeds.length - 1].footer = {
                text: `Page ${index + 1}/${messages.length}`,
            };

        message.components ??= [];
        message.components = [
            {
                type: ComponentType.ActionRow,
                components: [
                    ["⏪", "pages.first", ButtonStyle.Secondary],
                    ["◀️", "pages.left", ButtonStyle.Secondary],
                    ["🛑", "pages.stop", ButtonStyle.Danger],
                    ["▶️", "pages.right", ButtonStyle.Secondary],
                    ["⏩", "pages.last", ButtonStyle.Secondary],
                ].map(([emoji, customId, style]) => ({
                    type: ComponentType.Button,
                    style,
                    customId,
                    emoji,
                })),
            },
            ...message.components.slice(0, 4),
        ];
    });

    const message = await reply({
        ...messages[Math.min(page, messages.length - 1)],
        ephemeral,
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: (click: MessageComponentInteraction) => click.user.id === cmd.user.id,
        time: 890000,
    });

    let deleted = false;

    collector.on("collect", async (click: MessageComponentInteraction) => {
        switch (click.customId) {
            case "pages.first":
                page = 0;
                break;
            case "pages.left":
                page = (page + messages.length - 1) % messages.length;
                break;
            case "pages.right":
                page = (page + 1) % messages.length;
                break;
            case "pages.last":
                page = messages.length - 1;
                break;
            case "pages.stop":
                await click.update({
                    components: click.message.components.slice(1),
                });

                deleted = true;
                collector.stop();
                return;
            default:
                return;
        }

        await click.update(messages[page]);
    });

    collector.on("end", async () => {
        if (deleted) return;
        await message.edit({ components: message.components.slice(1) }).catch(() => {});
    });
}
