import Argentium from "argentium";
import { BaseMessageOptions, ChannelType, Events, Message, PartialMessage } from "discord.js";
import { DbCountSettings } from "shared";
import { db, getColor } from "shared/db.js";
import pagify from "../../lib/pagify.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (await isNotCountMessage(message)) return;

            const entry = await db.countSettings.findOne({ guild: message.guild!.id });
            if (!entry) return;

            const index = entry.channels.findIndex((x) => x.channel === message.channel.id);
            if (index === -1) return;

            const counter = entry.channels[index];
            if (!(await isCorrect(message, counter))) return void (await dismiss(message));

            last.set(message.channel.id, message.id);

            await db.countSettings.updateOne({ guild: message.guild!.id }, { $inc: { [`channels.${index}.next`]: counter.interval } });

            await db.countScoreboards.updateOne(
                { guild: message.guild!.id, id: counter.id },
                { $inc: { [`scores.${message.author.id}`]: 1 }, $set: { last: message.author.id } },
                { upsert: true },
            );
        })
        .on(Events.MessageDelete, handleChange)
        .on(Events.MessageUpdate, handleChange)
        .on(Events.MessageBulkDelete, async (messages) => await handleChange(messages.first()!))
        .commands((x) =>
            x.slash((x) =>
                x
                    .key("scoreboard")
                    .description("view the count channel scoreboard for a channel or the whole server")
                    .channelOption("channel", "the channel ƒor which to view the scoreboard", {
                        channelTypes: [
                            ChannelType.AnnouncementThread,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildText,
                            ChannelType.GuildVoice,
                            ChannelType.PrivateThread,
                            ChannelType.PublicThread,
                        ],
                    })
                    .fn(async ({ _, channel }) => {
                        let scores: Record<string, number>;

                        if (channel) {
                            const counter = (await db.countSettings.findOne({ guild: channel.guild.id }))?.channels.find((x) => x.channel === channel.id);
                            if (!counter) throw "That is not a count channel.";

                            scores = (await db.countScoreboards.findOne({ id: counter.id }))?.scores ?? {};
                        } else {
                            const { channels } = (await db.countSettings.findOne({ guild: _.guild!.id })) ?? {};
                            if (!channels?.length) throw "This server has no count channels.";

                            scores = {};

                            for await (const scoreboard of db.countScoreboards.find({ id: { $in: channels.map((x) => x.id) } }))
                                for (const [key, value] of Object.entries(scoreboard.scores)) scores[key] = (scores[key] ?? 0) + value;
                        }

                        await _.deferReply();

                        const rows: [[string, number], number][] = Object.entries(scores)
                            .sort(([, a], [, b]) => b - a)
                            .map((x, i) => [x, i]);

                        if (rows.length === 0) throw `Nobody has counter in this ${channel ? "channel" : "server"} yet.`;

                        const messages: BaseMessageOptions[] = [];

                        const color = await getColor(_.guild!);

                        while (rows.length > 0) {
                            const block = rows.splice(0, 20);
                            const digits = Math.floor(Math.log10(block.at(-1)![1] + 1));

                            messages.push({
                                embeds: [
                                    {
                                        title: "Count Scoreboard",
                                        description: `${channel ?? "Server-Wide"}\n\n${block
                                            .map(([[key, value], index]) => `\`${(index + 1).toString().padStart(digits)}.\` <@${key}>: \`${value}\``)
                                            .join("\n")}`,
                                        color,
                                    },
                                ],
                            });
                        }

                        await pagify(_, messages);
                    }),
            ),
        );

async function handleChange(before: Message | PartialMessage, after?: Message | PartialMessage) {
    if (before.content === after?.content) return;
    if (before.id !== last.get(before.channel.id)) return;
    if (await isNotCountMessage(before)) return;

    const seen = parseInt(before.content ?? "");
    if (isNaN(seen)) return;

    const counter = (await db.countSettings.findOne({ guild: before.guild!.id }))?.channels.find((x) => x.channel === before.channel.id);
    if (!counter) return;

    if (counter.next - seen !== counter.interval) return;

    if (after) await dismiss(before);
    await before.channel.send(`${before.author}: ${before.content}`);
}

const last = new Map<string, string>();

async function isNotCountMessage(message: Message | PartialMessage) {
    return !message.guild || message.author?.id === message.client.user.id || (await skip(message.guild, "count"));
}

async function isCorrect(message: Message, counter: DbCountSettings["channels"][0]) {
    const scoreboard = await db.countScoreboards.findOne({ guild: message.guild!.id, id: counter.id });
    return (
        message.content === counter.next.toString() &&
        message.attachments.size === 0 &&
        message.stickers.size === 0 &&
        (counter.allowDoubleCounting || message.author.id !== scoreboard?.last)
    );
}

async function dismiss(message: Message | PartialMessage) {
    await message.delete().catch(() => message.react(":x:").catch(() => {}));
}
