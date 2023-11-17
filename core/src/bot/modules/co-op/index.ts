import Argentium from "argentium";
import { db, getColor } from "shared/db.js";
import { mdash } from "../../lib/format.js";
import { fetchCaller } from "../../lib/hooks.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x.slash((x) =>
            x
                .key("co-op")
                .description("request co-op help (Genshin Impact)")
                .stringOption("query", "what you need help for", { maxLength: 1024 })
                .numberOption("world-level", "your world level (if you have a world-level role, you can leave this blank)", { minimum: 0, maximum: 8 })
                .numberOption("region", "your region (if you have a region role, you can leave this blank)", {
                    choices: { 0: "NA (Americas)", 1: "EU (Europe)", 2: "AS (Asia)", 3: "TW/HK/MO (Special Administrative Regions)" },
                })
                .fn(fetchCaller)
                .fn(async ({ _, caller, query, "world-level": worldLevel, region }) => {
                    const now = Date.now();

                    if (ratelimit.has(_.user.id) && now - ratelimit.get(_.user.id)! < 1800000)
                        throw "You may only use this command once every half an hour (globally).";

                    const settings = await db.coOpSettings.findOne({ guild: _.guild!.id });

                    if (worldLevel === null)
                        for (let i = 0; i < 8; i++)
                            if (settings?.worldLevelRoles[i] && caller.roles.cache.has(settings.worldLevelRoles[i]!))
                                if (worldLevel !== null) {
                                    worldLevel = null;
                                    break;
                                } else worldLevel = i;

                    if (worldLevel === null) throw "Please specify your world level.";

                    if (region === null)
                        for (let i = 0; i < 4; i++)
                            if (settings?.regionRoles[i] && caller.roles.cache.has(settings.regionRoles[i]!))
                                if (region !== null) {
                                    region = null;
                                    break;
                                } else region = i as 0 | 1 | 2 | 3;

                    if (region === null) throw "Please specify your server region.";

                    ratelimit.set(_.user.id, now);

                    return {
                        content: settings?.helperRoles[region] ? `<@&${settings.helperRoles[region]}>` : "",
                        embeds: [
                            {
                                title: `Co-op Request ${mdash} World Level ${worldLevel} ${mdash} ${
                                    ["NA (Americas)", "EU (Europe)", "AS (Asia)", "TW/HK/MO (Special Administrative Regions)"][region]
                                }`,
                                description: `${_.user} is requesting help${query ? ` with: ${query}` : ""}`,
                                color: await getColor(_.guild!),
                            },
                        ],
                        allowedMentions: { parse: ["roles"] },
                        ephemeral: false,
                    };
                }),
        ),
    );

const ratelimit = new Map<string, number>();
