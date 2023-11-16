import Argentium from "argentium";
import { ButtonStyle, ComponentType, Events, Message, PartialMessage } from "discord.js";
import { db } from "shared/db.js";
import { isAssignedClient } from "../../../lib/premium.js";
import { colors, template } from "../../lib/format.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (await isNotTicketMessage(message)) return;

            await db.tickets.updateOne(
                { channel: message.channel.id },
                {
                    $push: {
                        messages: {
                            type: "message",
                            id: message.id,
                            author: message.author.id,
                            content: message.content,
                            attachments: message.attachments.map((x) => ({ name: x.name, url: x.url })),
                            time: message.createdTimestamp,
                        },
                    },
                },
            );
        })
        .on(Events.MessageUpdate, async (before, after) => {
            if (before.content === after.content) return;
            if (await isNotTicketMessage(after)) return;

            const index = (await db.tickets.findOne({ channel: after.channel.id }))?.messages.findIndex((x) => x.type === "message" && x.id === after.id) ?? -1;
            if (index === -1) return;

            await db.tickets.updateOne({ channel: after.channel.id }, { $push: { [`messages.${index}.edits`]: after.content } });
        })
        .on(Events.MessageDelete, async (message) => {
            if (await isNotTicketMessage(message)) return;

            const index =
                (await db.tickets.findOne({ channel: message.channel.id }))?.messages.findIndex((x) => x.type === "message" && x.id === message.id) ?? -1;
            if (index === -1) return;

            await db.tickets.updateOne({ channel: message.channel.id }, { $set: { [`messages.${index}.deleted`]: true } });
        })
        .on(Events.MessageBulkDelete, async (messages) => {
            if (messages.size === 0 || (await isNotTicketMessage(messages.first()!))) return;

            const indexes: number[] = [];

            const doc = await db.tickets.findOne({ channel: messages.first()!.channel.id });
            if (!doc) return;

            doc.messages.forEach((message, index) => message.type === "message" && messages.has(message.id) && indexes.push(index));

            await db.tickets.updateOne(
                { channel: messages.first()!.channel.id },
                { $set: Object.fromEntries(indexes.map((index) => [`messages.${index}.deleted`, true])) },
            );
        })
        .commands((x) =>
            x.slash((x) =>
                x
                    .key("ticket close")
                    .description("close a ticket")
                    .fn(async ({ _ }) => {
                        const entry = await db.tickets.findOne({ channel: _.channel!.id });
                        if (!entry) throw "This is not a ticket channel.";
                        if (entry.closed) throw "This ticket is already closed.";

                        await _.deferReply();

                        await db.tickets.updateOne(
                            { channel: _.channel!.id },
                            { $set: { closed: true }, $push: { messages: { type: "close", author: _.user.id, time: Date.now() } } },
                        );

                        try {
                            const settings = await db.ticketsSettings.findOne({ guild: _.guild!.id });
                            if (!settings) throw 0;

                            const target = settings.prompts.find((x) => x.id === entry.prompt)?.targets.find((x) => x.id === entry.target);
                            if (!target) throw 0;

                            const channel = await _.guild!.channels.fetch(target.logChannel!);
                            if (!channel?.isTextBased()) throw 0;

                            await channel.send({
                                embeds: [{ title: "Ticket Closed", description: `<@${entry.user}>'s ticket was closed.`, color: colors.actions.delete }],
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                style: ButtonStyle.Link,
                                                label: "View on Dashboard",
                                                url: `${Bun.env.DOMAIN}/ticket/${entry.uuid}`,
                                            },
                                        ],
                                    },
                                ],
                            });

                            return template.success("This ticket is now closed!");
                        } catch {
                            throw "The ticket has been closed, but the log message could not be posted.";
                        } finally {
                            setTimeout(() => _.channel!.delete(), 5000);
                        }
                    }),
            ),
        );

async function isNotTicketMessage(message: Message | PartialMessage) {
    return (
        !message.guild ||
        !(await isAssignedClient(message.guild)) ||
        !message.author ||
        message.author.bot ||
        (await db.tickets.countDocuments({ channel: message.channel.id, closed: false })) === 0
    );
}
