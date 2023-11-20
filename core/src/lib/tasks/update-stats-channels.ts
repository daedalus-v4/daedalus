import { databaseIsReady, db, getLimitFor } from "shared/db.js";
import { formatCustomMessageString } from "shared/format-custom-message.js";
import { mdash, template } from "../../bot/lib/format.js";
import { invokeLog } from "../../bot/lib/logging.js";
import { skip } from "../../bot/modules/utils.js";
import cycle from "../cycle.js";
import { log } from "../log.js";
import { getClient } from "../premium.js";

cycle(
    async () => {
        if (!databaseIsReady) return;

        for await (const entry of db.statsChannelsSettings.find()) {
            try {
                const client = await getClient(entry.guild);
                const guild = await client.guilds.fetch(entry.guild);

                if (await skip(guild, "stats-channels")) continue;

                for (const item of entry.channels.slice(0, await getLimitFor(guild, "statsChannelsCount"))) {
                    if (!item.channel) continue;

                    const channel = await guild.channels.fetch(item.channel).catch(() => {});
                    if (!channel) continue;

                    try {
                        await channel.edit({ name: await formatCustomMessageString(item.parsed, { guild }) });
                    } catch (error) {
                        invokeLog("botError", channel, () =>
                            template.logerror(
                                `Bot Error ${mdash} Stats Channel`,
                                `Error editing the stats channel ${channel}. Check the bot's permissions and ensure your channel name format is valid. Here are some details about the error:\n\`\`\`\n${error}\n\`\`\``,
                            ),
                        );
                    }
                }
            } catch (error) {
                log.error(error, "8c9c6e35-97ff-467d-a0f5-e14cafbef146");
            }
        }
    },
    5 * 60 * 1000,
    "fcb7bbfb-fd54-4d71-9853-ed8b2f8f9698",
);
