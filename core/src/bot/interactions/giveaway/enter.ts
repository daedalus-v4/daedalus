import { ButtonInteraction, ButtonStyle, ComponentType } from "discord.js";
import { db } from "shared/db.js";
import { colors } from "../../lib/format.js";
import { countEntries } from "../../modules/giveaways/lib.js";

const exit = (id: number) => [
    {
        type: ComponentType.ActionRow,
        components: [{ type: ComponentType.Button, style: ButtonStyle.Danger, customId: `::giveaway/exit:${id}`, emoji: "⬅️", label: "Withdraw Entry" }],
    },
];

export default async function (button: ButtonInteraction) {
    const giveaways = (await db.giveawaysSettings.findOne({ guild: button.guild!.id }))?.giveaways;
    const index = giveaways?.findIndex((x) => x.messageId === button.message.id);
    const giveaway = giveaways?.[index ?? -1];

    if (!giveaway) throw "This giveaway appears to no longer exist.";
    if (giveaway.deadline < Date.now()) throw "This giveaway has already ended.";

    const caller = await button.guild!.members.fetch(button.user);

    const count = await countEntries(giveaway, caller);
    const key = { guild: button.guild!.id, id: giveaway.id, user: button.user.id };

    if ((await db.giveawayEntries.countDocuments(key)) > 0)
        return {
            embeds: [
                {
                    title: "Giveaway Entry",
                    description: `You have already entered the giveaway with **${count} ${count === 1 ? "entry" : "entries"}**. Click below to withdraw.`,
                    color: colors.prompts.info,
                },
            ],
            components: exit(giveaway.id),
            ephemeral: true,
        };

    await db.giveawayEntries.updateOne(key, { $set: { user: button.user.id } }, { upsert: true });

    return {
        embeds: [
            {
                title: "Giveaway Entry",
                description: `${
                    count === 0
                        ? "You have entered the giveaway but are not eligible and have no entries. Eligibility is calculated immediately before the draw, so if you become eligible later, you'll have a chance to win."
                        : `You have entered the giveaway with **${count} ${
                              count === 1 ? "entry" : "entries"
                          }**. ELigibility is calculated immediately before the draw, so if you gain more entries, you do not need to re-enter the giveaway.`
                } Click below to withdraw.`,
                color: colors.statuses.success,
            },
        ],
        components: exit(giveaway.id),
        ephemeral: true,
    };
}
