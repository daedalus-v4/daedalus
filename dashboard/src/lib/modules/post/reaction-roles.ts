import getClient from "$lib/get-client.js";
import { invariant, lazy } from "$lib/utils.js";
import { ButtonStyle, ComponentType, type BaseMessageOptions, type Message } from "discord.js";
import type { DbReactionRolesSettings } from "shared";
import { autoIncrement, db } from "shared/db.js";

const buttonStyles = {
    gray: ButtonStyle.Secondary,
    blue: ButtonStyle.Primary,
    green: ButtonStyle.Success,
    red: ButtonStyle.Danger,
} as const;

export default async function (settings: DbReactionRolesSettings, currentGuild: string): Promise<DbReactionRolesSettings> {
    const bot = await getClient(currentGuild);
    const guild = await bot.guilds.fetch(currentGuild);

    const entryList = (await db.reactionRolesSettings.findOne({ guild: currentGuild }))?.entries ?? [];
    const entryMap = Object.fromEntries(entryList.map((x) => [x.id, x]));
    const ids = settings.entries.map((x) => x.id);

    for (const entry of entryList)
        if (!ids.includes(entry.id))
            try {
                const channel = await bot.channels.fetch(entry.channel!);
                if (!channel?.isTextBased()) throw 0;
                const message = await channel.messages.fetch(entry.message!);

                if (entry.addReactionsToExistingMessage) await message.reactions.removeAll();
                else await message.delete();
            } catch {
                // ignore deletion errors
            } finally {
                delete entryMap[entry.id];
            }

    for (let index = 0; index < settings.entries.length; index++) {
        const entry = settings.entries[index];

        try {
            if (entry.addReactionsToExistingMessage) {
                const match = entry.url.match(/(\d+)\/(\d+)\/(\d+)/)!;
                if (!match) throw "Invalid message URL.";
                const [, gid, cid, mid] = match;

                if (gid !== currentGuild) throw "Message URL must point to a message in this server.";

                const channel = await guild.channels.fetch(cid).catch(() => {});
                if (!channel?.isTextBased()) throw "Invalid message URL / channel cannot be viewed.";

                const message = await channel.messages.fetch(mid).catch(() => {});
                if (!message) throw "Invalid message URL (message does not exist in the channel).";

                await (async () => {
                    for (const { emoji } of entry.reactionData) if (!message.reactions.cache.has(emoji!)) await message.react(emoji!);
                })().catch(() => {
                    throw "Adding reactions failed. Ensure all emoji still exist and the bot has permission to use them.";
                });

                entry.channel = channel.id;
                entry.message = message.id;
            } else {
                const data: () => BaseMessageOptions = lazy(() => ({
                    ...entry.promptMessage,
                    components:
                        entry.style === "dropdown"
                            ? [
                                  {
                                      type: ComponentType.ActionRow,
                                      components: [
                                          {
                                              type: ComponentType.StringSelect,
                                              customId: "::reaction-roles/dropdown",
                                              options: entry.dropdownData.map((x, i) => ({
                                                  label: x.label,
                                                  value: `${i}`,
                                                  description: x.description || undefined,
                                                  emoji: x.emoji || undefined,
                                              })),
                                              minValues: entry.type === "lock" ? 1 : 0,
                                              maxValues: entry.type === "unique" || entry.type === "lock" ? 1 : entry.dropdownData.length,
                                          },
                                      ],
                                  },
                              ]
                            : entry.style === "buttons"
                            ? entry.buttonData.map((row, ri) => ({
                                  type: ComponentType.ActionRow,
                                  components: row.map((x, i) => ({
                                      type: ComponentType.Button,
                                      style: buttonStyles[x.color],
                                      customId: `::reaction-roles/button:${ri}:${i}`,
                                      emoji: x.emoji || undefined,
                                      label: x.label || undefined,
                                  })),
                              }))
                            : [],
                }));

                let message: Message | undefined;
                const shouldPost = () =>
                    !invariant(
                        (x) =>
                            JSON.stringify([
                                x.promptMessage,
                                x.style,
                                x.style === "dropdown"
                                    ? x.dropdownData.map((x) => ({ ...x, role: null }))
                                    : x.style === "buttons"
                                    ? x.buttonData.map((x) => x.map((x) => ({ ...x, role: null })))
                                    : [],
                            ]),
                        entry,
                        entryMap[entry.id],
                    );

                if (entry.id in entryMap) {
                    if (entry.channel === entryMap[entry.id].channel) {
                        const channel = await guild.channels.fetch(entry.channel!).catch(() => {});
                        if (!channel?.isTextBased()) throw "Could not fetch channel.";

                        let edit = false;

                        try {
                            message = await channel.messages.fetch({ message: entryMap[entry.id].message!, force: true });
                            edit = true;
                        } catch {
                            message = await channel.send(data()).catch((error) => {
                                throw `Could neither fetch the message in #${channel.name} to edit nor send a new one: ${error}`;
                            });
                        }

                        if (edit && shouldPost()) await message.edit(data());
                    } else {
                        try {
                            const channel = await guild.channels.fetch(entryMap[entry.id].channel!);
                            if (!channel?.isTextBased()) throw 0;
                            const message = await channel.messages.fetch(entryMap[entry.id].message!);

                            await message.delete();
                        } catch {
                            // ignore deletion errors
                        }
                    }
                }

                if (!message) {
                    const channel = await guild.channels.fetch(entry.channel!).catch(() => {});
                    if (!channel?.isTextBased()) throw "Could not fetch channel.";

                    message = await channel.send(data()).catch(() => {
                        throw `Could not send message in #${channel.name}`;
                    });
                }

                entry.message = message.id;

                if (entry.style === "reactions")
                    await (async () => {
                        for (const { emoji } of entry.reactionData) if (!message.reactions.cache.has(emoji!)) await message.react(emoji!);
                    })().catch(() => {
                        throw "Adding reactions failed. Ensure all emoji still exist and the bot has permission to use them.";
                    });

                entry.error = null;
            }
        } catch (error) {
            entry.error = `${error}`;
        } finally {
            if (entry.id in entryMap) entryMap[entry.id] = entry;
            else entryMap[(entry.id = await autoIncrement(`reaction-role-ids/${currentGuild}`))] = entry;
        }
    }

    return { entries: Object.values(entryMap).sort((x, y) => x.id - y.id) };
}
