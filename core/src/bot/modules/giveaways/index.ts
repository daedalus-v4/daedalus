import Argentium from "argentium";
import { db, getColor } from "shared/db.js";
import { englishList } from "../../lib/format.js";
import { draw } from "./lib.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x.slash((x) =>
            x
                .key("giveaway reroll")
                .description("reroll a giveaway")
                .numberOption("id", "the ID of the giveaway", { required: true })
                .numberOption("winners", "the number of winners to roll")
                .fn(async ({ _, id, winners }) => {
                    const giveaway = (await db.giveawaysSettings.findOne({ guild: _.guild!.id }))?.giveaways.find((x) => x.id === id);
                    if (!giveaway) throw "That giveaway does not exist.";
                    if (!giveaway.closed) throw "That giveaway has not been closed yet.";

                    const result = await draw(_.guild!, giveaway, winners ?? giveaway.winners);

                    return {
                        embeds: [
                            {
                                title: "**Reroll Results**",
                                description: result.length > 0 ? `Congratulations to ${englishList(result)}!` : "Nobody was eligible.",
                                color: await getColor(_.guild!),
                            },
                        ],
                    };
                }),
        ),
    );
