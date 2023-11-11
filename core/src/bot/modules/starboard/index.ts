import Argentium from "argentium";
import { APIEmbed, Channel, Collection, Events, GuildBasedChannel, Message, PartialMessage, Snowflake } from "discord.js";
import { DbStarboardSettings } from "shared";
import { db, getColor } from "shared/db.js";
import { SpoilerLevel, copyMedia } from "../../lib/copy-media.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageReactionAdd, (reaction) => checkStars(reaction.message))
        .on(Events.MessageReactionRemove, (reaction) => checkStars(reaction.message))
        .on(Events.MessageReactionRemoveEmoji, (reaction) => checkStars(reaction.message))
        .on(Events.MessageReactionRemoveAll, checkStars)
        .on(Events.MessageDelete, checkDelete)
        .on(Events.MessageBulkDelete, checkBulkDelete);

const stars = new Set<string>();

async function checkStars(input: Message | PartialMessage): Promise<void> {
    const message = await input.fetch();

    if (!message.guild) return;
    if (await skip(message.guild, "starboard")) return;
    if ((await db.starboardLinks.countDocuments({ target: message.id })) > 0) return;

    const settings = await db.starboardSettings.findOne({ guild: message.guild.id });
    if (!settings?.detectEmoji) return;

    const starboard = await getStarboard(settings, message.channel);
    if (!starboard) return;

    const reaction = message.reactions.cache.get(settings.detectEmoji);
    const count = reaction?.count ?? 0;
    const target = await getStarboardLink(starboard.target, message.id);

    if (count < starboard.threshold) {
        stars.delete(message.id);
        await target?.delete().catch(() => {});
        await db.starboardLinks.deleteOne({ message: message.id });
    } else {
        const content = `${reaction!.emoji} **${count}** ${message.channel}`;

        if (target) await target.edit({ content });
        else {
            if (isNSFW(message.channel) && !isNSFW(starboard.target)) return;
            if (stars.has(message.id)) return void setTimeout(() => checkStars(message), 1000);
            stars.add(message.id);

            const attachments = await copyMedia(message, SpoilerLevel.KEEP);

            const single =
                attachments.length === 1 &&
                !attachments[0].name?.startsWith("SPOILER_") &&
                ["png", "jpg"].includes((attachments[0].name ?? "").split(".").at(-1)!);

            let embeds: APIEmbed[] = [
                {
                    description: message.content,
                    color: await getColor(message.guild),
                    fields: [{ name: "Source", value: `[Jump!](${message.url})` }],
                    author: { name: message.author.tag, icon_url: (message.member ?? message.author).displayAvatarURL({ size: 64 }) },
                    footer: { text: message.id },
                    image: single ? { url: attachments[0].attachment as string } : undefined,
                },
            ];

            let files = [];

            if (!message.embeds.some((embed) => embed.data.type === "rich")) files = single ? [] : attachments;
            else {
                embeds[0].image = undefined;
                files = attachments;
                embeds = [...message.embeds.map((e) => e.toJSON()).slice(0, 9), embeds[0]];
            }

            const link = await starboard.target.send({ content, embeds, files });
            await db.starboardLinks.insertOne({ message: message.id, target: link.id });
        }
    }
}

async function checkDelete(message: Message | PartialMessage) {
    if (!message.guild) return;
    if (await skip(message.guild, "starboard")) return;

    const settings = await db.starboardSettings.findOne({ guild: message.guild.id });
    if (!settings) return;

    const starboard = await getStarboard(settings, message.channel);
    if (!starboard) return;

    const target = await getStarboardLink(starboard.target, message.id);
    if (!target) return;

    target.delete();
    await db.starboardLinks.deleteOne({ message: message.id });
}

async function checkBulkDelete(messages: Collection<Snowflake, Message | PartialMessage>) {
    const channel = messages.first()?.channel;
    if (!channel || channel.isDMBased()) return;

    const guild = channel.guild;

    const settings = await db.starboardSettings.findOne({ guild: guild.id });
    if (!settings) return;

    const starboard = await getStarboard(settings, channel);
    if (!starboard) return;

    const targets = (await db.starboardLinks.find({ message: { $in: [...messages.keys()] } }).toArray()).map((doc) => doc.target);
    if (targets.length === 0) return;

    try {
        await starboard.target.bulkDelete(targets);
    } catch {
        for (const target of targets) await starboard.target.messages.delete(target).catch(() => {});
    }

    await db.starboardLinks.deleteMany({ target: { $in: targets } });
}

async function getStarboard(settings: DbStarboardSettings, channel: Channel) {
    if (channel.isDMBased()) return;

    try {
        let target: GuildBasedChannel | undefined | null, threshold: number | undefined;
        let current: GuildBasedChannel | null = channel;

        do {
            const override = settings.channels[current.id];
            if (override.disable) return;
            if (!target && override.overrideChannel) target = await current.guild.channels.fetch(override.overrideChannel);
            if (!threshold && override.overrideThreshold) threshold = override.overrideThreshold;
        } while ((current = current.parent));

        if (!target)
            if (settings.defaultChannel) target = await channel.guild.channels.fetch(settings.defaultChannel);
            else return;

        threshold ??= settings.defaultThreshold ?? 5;

        if (target?.isTextBased()) return { target, threshold };
    } catch {}
}

async function getStarboardLink(channel: Channel, message: string) {
    if (!channel.isTextBased()) return;

    const entry = await db.starboardLinks.findOne({ message: message });
    if (!entry) return;

    return await channel.messages.fetch(entry.target).catch(() => {});
}

function isNSFW(channel: Channel) {
    if ("nsfw" in channel) return channel.nsfw;
    if ("parent" in channel) return channel.parent?.nsfw ?? false;
    return false;
}
