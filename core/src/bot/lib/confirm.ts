import { BaseMessageOptions, ButtonInteraction, ButtonStyle, ComponentType, InteractionReplyOptions, RepliableInteraction } from "discord.js";

export default async function (
    interaction: RepliableInteraction,
    data: BaseMessageOptions,
    timeout: number,
    yesLabel: string = "CONFIRM",
    noLabel: string = "CANCEL",
): Promise<ButtonInteraction | null> {
    const uuid = crypto.randomUUID();

    const send: InteractionReplyOptions = {
        ...data,
        fetchReply: true,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, customId: `#/${uuid}`, style: ButtonStyle.Success, label: yesLabel ?? "Confirm" },
                    { type: ComponentType.Button, customId: `:${interaction.user.id}:cancel`, style: ButtonStyle.Danger, label: noLabel ?? "Cancel" },
                ],
            },
        ],
    };

    const reply = interaction.replied
        ? await interaction.followUp(send)
        : interaction.deferred
          ? await interaction.editReply(send)
          : await interaction.reply(send);

    const timer =
        timeout > 0
            ? setTimeout(async () => {
                  await reply.edit({
                      content: null,
                      embeds: [],
                      files: [],
                      components: [
                          {
                              type: ComponentType.ActionRow,
                              components: [
                                  { type: ComponentType.Button, style: ButtonStyle.Secondary, customId: ".", label: "Confirmation Timed Out", disabled: true },
                              ],
                          },
                      ],
                  });
              }, timeout)
            : null;

    try {
        const response = await reply.awaitMessageComponent({
            componentType: ComponentType.Button,
            filter: (x) => x.user.id === interaction.user.id,
            time: timeout || undefined,
        });

        if (response.customId === `#/${uuid}`) {
            if (timer) clearTimeout(timer);
            return response;
        } else return null;
    } catch {
        return null;
    }
}
