import { ObjectId } from "mongodb";
import { databaseIsReady, db, getColor } from "shared/db.js";
import { englishList, mdash, template } from "../../bot/lib/format.js";
import { invokeLog } from "../../bot/lib/logging.js";
import { draw } from "../../bot/modules/giveaways/lib.js";
import cycle from "../cycle.js";
import { getClient } from "../premium.js";

cycle(
    async () => {
        if (!databaseIsReady) return;

        const close: { _id: ObjectId; ids: number[] }[] = [];

        for await (const settings of db.giveawaysSettings.find({ giveaways: { $elemMatch: { closed: false, deadline: { $lte: Date.now() } } } })) {
            const client = await getClient(settings.guild).catch(() => {});
            if (!client) continue;

            const guild = await client.guilds.fetch(settings.guild).catch(() => {});
            if (!guild) continue;

            const ids: number[] = [];

            for (let index = 0; index < settings.giveaways.length; index++) {
                const giveaway = settings.giveaways[index];
                if (giveaway.closed || giveaway.deadline > Date.now()) continue;

                ids.push(giveaway.id);

                try {
                    const channel = await guild.channels.fetch(giveaway.channel!);
                    if (!channel?.isTextBased()) throw 0;

                    const result = await draw(guild, giveaway);

                    try {
                        const message = await channel.messages.fetch(giveaway.messageId!);

                        await message.edit({
                            components: message.components.map((row) => ({
                                type: row.type,
                                components: row.toJSON().components.map((x) => ({ ...x, disabled: true })),
                            })),
                        });
                    } catch {}

                    await channel.send({
                        embeds: [
                            {
                                title: `**Giveaway Results (ID: \`${giveaway.id}\`)**`,
                                description: result.length > 0 ? `Congratulations to ${englishList(result)}!` : "Nobody was eligible!",
                                color: await getColor(guild),
                            },
                        ],
                    });
                } catch (error) {
                    invokeLog("botError", guild, () =>
                        template.logerror(
                            `Bot Error ${mdash} Ending Giveaway ${giveaway.id}`,
                            "Ending the giveaway failed. Make sure the bot has read and write access to the giveaway channel. You can use **/giveaway reroll** to roll the giveaway manually.",
                        ),
                    );
                }
            }

            if (ids.length > 0) close.push({ _id: settings._id, ids });
        }

        if (close.length > 0)
            await db.giveawaysSettings.bulkWrite(
                close.map(({ _id, ids }) => ({
                    updateOne: {
                        filter: { _id },
                        update: { $set: { "giveaways.$[element].closed": true } },
                        arrayFilters: [{ "element.id": { $in: ids } }],
                    },
                })),
            );
    },
    10 * 1000,
    "ec90dfbb-fa42-4f0c-acdf-e5a52595184d",
);
