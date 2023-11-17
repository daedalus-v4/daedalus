import getClient from "$lib/get-client.js";
import { invariant, lazy } from "$lib/utils.js";
import { ButtonStyle, ComponentType, type BaseMessageOptions, type Message } from "discord.js";
import type { DbGiveawaysSettings } from "shared";
import { autoIncrement, db } from "shared/db.js";

export default async function (settings: DbGiveawaysSettings, currentGuild: string): Promise<DbGiveawaysSettings> {
    const bot = await getClient(currentGuild);
    const guild = await bot.guilds.fetch(currentGuild);

    const giveawayList = (await db.giveawaysSettings.findOne({ guild: currentGuild }))?.giveaways ?? [];
    const giveawayMap = Object.fromEntries(giveawayList.map((x) => [x.id, x]));
    const ids = settings.giveaways.map((x) => x.id);

    for (const giveaway of giveawayList)
        if (!ids.includes(giveaway.id))
            try {
                const channel = await guild.channels.fetch(giveaway.channel!);
                if (!channel?.isTextBased()) throw 0;
                const message = await channel.messages.fetch(giveaway.messageId!);

                await message.delete();
            } catch {
                // ignore deletion errors
            } finally {
                delete giveawayMap[giveaway.id];
            }

    for (const giveaway of settings.giveaways) {
        try {
            const data: () => BaseMessageOptions = lazy(() => ({
                ...(giveaway.id in giveawayMap && invariant(JSON.stringify, giveaway.message, giveawayMap[giveaway.id].message) ? {} : giveaway.message),
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Secondary,
                                customId: `::giveaway/enter`,
                                emoji: "🎉",
                                label: "Enter Giveaway",
                                disabled: giveaway.deadline < Date.now(),
                            },
                        ],
                    },
                ],
            }));

            let message: Message | undefined;
            const shouldPost = () => !invariant((x) => JSON.stringify([x.message, x.deadline < Date.now()]), giveaway, giveawayMap[giveaway.id]);

            if (giveaway.id in giveawayMap) {
                if (giveaway.channel === giveawayMap[giveaway.id].channel) {
                    const channel = await guild.channels.fetch(giveaway.channel!).catch(() => {});
                    if (!channel?.isTextBased()) throw "Could not fetch channel.";

                    let edit = false;

                    try {
                        message = await channel.messages.fetch({ message: giveawayMap[giveaway.id].messageId!, force: true });
                        edit = true;
                    } catch {
                        message = await channel.send(data()).catch((error) => {
                            throw `Could neither fetch the message in #${channel.name} to edit nor send a new one: ${error}`;
                        });
                    }

                    if (edit && shouldPost()) await message.edit(data());
                } else {
                    try {
                        const channel = await guild.channels.fetch(giveawayMap[giveaway.id].channel!);
                        if (!channel?.isTextBased()) throw 0;
                        const toDelete = await channel.messages.fetch(giveawayMap[giveaway.id].messageId!);

                        await toDelete.delete();
                    } catch {
                        // ignore deletion errors
                    }
                }
            }

            if (!message) {
                const channel = await guild.channels.fetch(giveaway.channel!).catch(() => {});
                if (!channel?.isTextBased()) throw "Could not fetch channel.";

                message = await channel.send(data()).catch(() => {
                    throw `Could not send message in #${channel.name}.`;
                });
            }

            giveaway.messageId = message.id;
            giveaway.error = null;
        } catch (error) {
            giveaway.error = `${error}`;
        } finally {
            if (giveaway.deadline > Date.now()) giveaway.closed = false;

            if (giveaway.id in giveawayMap) giveawayMap[giveaway.id] = giveaway;
            else giveawayMap[(giveaway.id = await autoIncrement(`giveaways/${currentGuild}`))] = giveaway;
        }
    }

    return settings;
}
