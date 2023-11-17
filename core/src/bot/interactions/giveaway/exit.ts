import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { colors } from "../../lib/format.js";

export default async function (button: ButtonInteraction, _id: string) {
    const id = parseInt(_id);

    const giveaways = (await db.giveawaysSettings.findOne({ guild: button.guild!.id }))?.giveaways;
    const index = giveaways?.findIndex((x) => x.id === id);
    const giveaway = giveaways?.[index ?? -1];

    if (!giveaway) throw "This giveaway appears to no longer exist.";
    if (giveaway.deadline < Date.now()) throw "This giveaway has already ended.";

    const { deletedCount } = await db.giveawayEntries.deleteOne({ guild: button.guild!.id, user: button.user.id });

    await button.update({
        embeds: [
            {
                title: "Giveaway Entry Withdrawn",
                description: deletedCount === 0 ? "You already did not have an entry in the giveaway." : "You have withdrawn your entry from the giveaway.",
                color: deletedCount === 0 ? colors.prompts.info : colors.statuses.success,
            },
        ],
        components: [],
    });
}
