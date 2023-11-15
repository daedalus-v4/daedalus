import getClient from "$lib/get-client.js";
import { invariant, lazy } from "$lib/utils.js";
import { ButtonStyle, ComponentType, type BaseMessageOptions, type Message } from "discord.js";
import { limits, type DbTicketsSettings } from "shared";
import { autoIncrement, db, getPremiumBenefitsFor } from "shared/db.js";

export default async function (settings: DbTicketsSettings, currentGuild: string): Promise<DbTicketsSettings> {
    const bot = await getClient(currentGuild);
    const guild = await bot.guilds.fetch(currentGuild);

    const promptList = (await db.ticketsSettings.findOne({ guild: currentGuild }))?.prompts ?? [];
    const promptMap = Object.fromEntries(promptList.map((x) => [x.id, x]));
    const ids = settings.prompts.map((x) => x.id);

    for (const prompt of promptList)
        if (!ids.includes(prompt.id))
            try {
                const channel = await guild.channels.fetch(prompt.channel!);
                if (!channel?.isTextBased()) throw 0;
                const message = await channel.messages.fetch(prompt.message!);

                await message.delete();
            } catch {
                // ignore deletion errors
            } finally {
                delete promptMap[prompt.id];
            }

    const { multiTickets, increasedLimits } = await getPremiumBenefitsFor(guild.id);
    const limit = limits.ticketPromptCount[increasedLimits];
    const targetLimit = limits.ticketTargetCount[increasedLimits];

    for (let index = 0; index < settings.prompts.length; index++) {
        const prompt = settings.prompts[index];

        try {
            if (index >= limit)
                throw "This ticket prompt is disabled due to exceeding the server's ticket prompt limit. Please remove some entries or upgrade your plan. For your convenience, the message has not been deleted.";

            const targets = prompt.targets.slice(0, prompt.multi && multiTickets ? targetLimit : 1).filter((x) => !!x.logChannel && !!x.category);
            if (targets.length === 0)
                throw prompt.multi && multiTickets
                    ? "At least one target must be configured (log channel and category must both be set)."
                    : "Ticket target is not configured (log channel and category must both be set).";

            const data: () => BaseMessageOptions = lazy(() => ({
                ...(prompt.id in promptMap && invariant(JSON.stringify, prompt.prompt, promptMap[prompt.id].prompt) ? {} : prompt.prompt),
                components:
                    prompt.multi && multiTickets
                        ? [
                              {
                                  type: ComponentType.ActionRow,
                                  components: [
                                      {
                                          type: ComponentType.StringSelect,
                                          customId: `::ticket`,
                                          options: targets.map((x) => ({
                                              label: x.name,
                                              value: `${x.id}`,
                                              description: x.description || undefined,
                                              emoji: x.emoji || undefined,
                                          })),
                                      },
                                  ],
                              },
                          ]
                        : [
                              {
                                  type: ComponentType.ActionRow,
                                  components: [
                                      {
                                          type: ComponentType.Button,
                                          style: ButtonStyle[
                                              ({ gray: "Secondary", blue: "Primary", green: "Success", red: "Danger" } as const)[targets[0].buttonColor]
                                          ],
                                          customId: `::ticket:${targets[0].id}`,
                                          emoji: targets[0].emoji || undefined,
                                          label: targets[0].label || undefined,
                                      },
                                  ],
                              },
                          ],
            }));

            let message: Message | undefined;
            const shouldPost = () =>
                !invariant((x) => JSON.stringify([x.prompt, x.multi, targets.map((x) => [x.name, x.description, x.emoji])]), prompt, promptMap[prompt.id]);

            if (prompt.id in promptMap) {
                if (prompt.channel === promptMap[prompt.id].channel) {
                    const channel = await guild.channels.fetch(prompt.channel!).catch(() => {});
                    if (!channel?.isTextBased()) throw "Could not fetch channel.";

                    let edit = false;

                    try {
                        message = await channel.messages.fetch({ message: promptMap[prompt.id].message!, force: true });
                        edit = true;
                    } catch {
                        message = await channel.send(data()).catch((error) => {
                            throw `Could neither fetch the message in #${channel.name} to edit nor send a new one: ${error}`;
                        });
                    }

                    if (edit && shouldPost()) await message.edit(data());
                } else {
                    try {
                        const channel = await guild.channels.fetch(promptMap[prompt.id].channel!);
                        if (!channel?.isTextBased()) throw 0;
                        const toDelete = await channel.messages.fetch(promptMap[prompt.id].message!);

                        await toDelete.delete();
                    } catch {
                        // ignore deletion errors
                    }
                }
            }

            if (!message) {
                const channel = await guild.channels.fetch(prompt.channel!).catch(() => {});
                if (!channel?.isTextBased()) throw "Could not fetch channel.";

                message = await channel.send(data()).catch(() => {
                    throw `Could not send message in #${channel.name}.`;
                });
            }

            prompt.message = message.id;
            prompt.error = null;
        } catch (error) {
            prompt.error = `${error}`;
        } finally {
            if (prompt.id in promptMap) promptMap[prompt.id] = prompt;
            else promptMap[(prompt.id = await autoIncrement(`tickets/${currentGuild}`))] = prompt;
        }
    }

    return { prompts: Object.values(promptMap).sort((x, y) => x.id - y.id) };
}
