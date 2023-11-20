import Argentium from "argentium";
import { ComponentType, Events, GuildTextBasedChannel, TextInputStyle } from "discord.js";
import { db, getColor } from "shared/db.js";
import { template, truncate } from "../../lib/format.js";
import pagify from "../../lib/pagify.js";
import { skip } from "../utils.js";
import { updateStick } from "./lib.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (!message.guild) return;
            if (message.author.id === message.client.user.id) return;
            if (await skip(message.guild, "sticky-messages")) return;

            await updateStick(message.channel as GuildTextBasedChannel);
        })
        .commands((x) =>
            x
                .slash((x) =>
                    x
                        .key("stick")
                        .description("set the channel's sticky message")
                        .numberOption("seconds", "the minimum number of seconds to wait between reposts (minimum and default: 4)")
                        .fn(async ({ _, seconds }) => {
                            const entry = await db.stickyMessages.findOne({ guild: _.guild!.id, channel: _.channel!.id });

                            await _.showModal({
                                customId: `:stick:${seconds ?? 4}`,
                                title: "Sticky Message",
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.TextInput,
                                                style: TextInputStyle.Paragraph,
                                                customId: "message",
                                                label: "Message",
                                                value: entry?.content,
                                                required: true,
                                                maxLength: 2000,
                                            },
                                        ],
                                    },
                                ],
                            });
                        }),
                )
                .slash((x) =>
                    x
                        .key("unstick")
                        .description("remove the channel's sticky message")
                        .fn(async ({ _ }) => {
                            const entry = await db.stickyMessages.findOneAndDelete({ channel: _.channel!.id });
                            if (!entry) throw "This channel does not have a sticky message.";

                            await _.deferReply({ ephemeral: true });
                            await updateStick(_.channel as GuildTextBasedChannel);
                            return template.success("Removed this channel's sticky message.");
                        }),
                )
                .slash((x) =>
                    x
                        .key("sticklist")
                        .description("list the server's sticky messages")
                        .fn(async ({ _ }) => {
                            let entries = await db.stickyMessages.find({ guild: _.guild!.id }).toArray();

                            const toDelete = entries.map((entry) => entry.channel).filter((channel) => !_.guild!.channels.cache.has(channel));
                            await db.stickyMessages.deleteMany({ guild: _.guild!.id, channel: { $in: toDelete } });

                            entries = await db.stickyMessages.find({ guild: _.guild!.id }).toArray();

                            const messages = [];

                            while (entries.length > 0)
                                messages.push({
                                    embeds: [
                                        {
                                            title: "Sticky Messages",
                                            color: await getColor(_.guild!),
                                            fields: entries.splice(0, 5).map((entry) => ({
                                                name: `<#${entry.channel}>`,
                                                value: truncate(entry.content, 1024),
                                            })),
                                        },
                                    ],
                                });

                            await pagify(_, messages);
                        }),
                ),
        );
