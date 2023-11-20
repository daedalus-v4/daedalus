import Argentium from "argentium";
import { ChannelType, Events, GuildMember, GuildTextBasedChannel, MessageType, PermissionFlagsBits } from "discord.js";
import { formatDuration, parseDuration } from "shared";
import { db, getColor } from "shared/db.js";
import { stem, textlike } from "../../../lib/utils.js";
import { colors, template, timestamp, truncate } from "../../lib/format.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (!message.guild) return;
            if (message.author.id === message.client.user.id) return;
            if (await skip(message.guild, "highlights")) return;

            const now = Date.now();
            lastSeen.set(`${message.channel.id}/${message.author.id}`, now);

            let repliedAuthor: string | undefined;

            if (message.type === MessageType.Reply) {
                const id = message.mentions.repliedUser?.id;
                if (!id) return;

                const member = message.guild.members.cache.get(id);

                if (!message.mentions.users.has(id) && (!member || !member.roles.cache.hasAny(...message.mentions.roles.keys()))) repliedAuthor = id;
            }

            const normalized = message.content.split(/\s+/).map((x) => [stem(x).join(""), x]);

            const members: { member: GuildMember; reply: boolean; reason?: { found: string; phrase: string } }[] = [];

            for await (const entry of db.highlights.find({ guild: message.guild.id })) {
                const member = message.guild.members.cache.get(entry.user);
                if (!member) continue;
                if (member.id === message.author.id) continue;

                const key = `${message.channel.id}/${member.id}`;

                if (
                    (lastSeen.has(key) && now - lastSeen.get(key)! < (entry.delay ?? 300000)) ||
                    (lastHighlighted.has(key) && now - lastHighlighted.get(key)! < (entry.cooldown ?? 300000))
                )
                    continue;

                if (entry.blockedUsers?.includes(message.author.id)) continue;
                if (entry.blockedChannels?.includes(message.channel.id)) continue;

                if (message.channel.isThread()) {
                    if (!message.channel.parent?.permissionsFor(member).has(PermissionFlagsBits.ViewChannel)) continue;

                    if (
                        message.channel.type === ChannelType.PrivateThread &&
                        !message.channel.members.cache.has(member.id) &&
                        !message.channel.parent.permissionsFor(member).has(PermissionFlagsBits.ManageThreads)
                    )
                        continue;
                } else if (!(message.channel as GuildTextBasedChannel).permissionsFor(member).has(PermissionFlagsBits.ViewChannel)) continue;

                const reply = !!entry.replies && repliedAuthor === member.id;
                let reason: { found: string; phrase: string } | undefined;

                if (!reply)
                    for (const phrase of entry.phrases ?? []) {
                        const list = phrase.split(" ");
                        let found: string[] = [];
                        let index = 0;

                        for (const [stemmed, word] of normalized)
                            if (!stemmed) {
                                if (index > 0) found.push(word);
                            } else if (stemmed === list[index]) {
                                found.push(word);
                                index++;
                                if (index >= list.length) break;
                            } else {
                                index = 0;
                                found = [];

                                if (stemmed === list[index]) {
                                    found.push(word);
                                    index++;
                                    if (index >= list.length) break;
                                }
                            }

                        if (index >= list.length) {
                            reason = { found: found.join(" "), phrase: list.join(" ") };
                            break;
                        }
                    }

                if (reply || reason) members.push({ member, reply, reason });
            }

            if (members.length === 0) return;

            const color = await getColor(message.guild);
            const messages: string[] = [];

            for (let x = -5; x < 0; x++) {
                const m = message.channel.messages.cache.at(x);

                if (m) messages.push(`[${timestamp(m.createdTimestamp)}] ${m.author.tag ?? "Unknown User"}: ${truncate(m.content, 1000)}`);
            }

            const context = messages.join("\n");

            for (const { member, reply, reason } of members) {
                const sent = await member
                    .send({
                        embeds: [
                            {
                                title: "Highlight Triggered",
                                description: `You were highlighted in ${message.channel} (${
                                    reply
                                        ? "replied message without ping"
                                        : reason!.found === reason!.phrase
                                          ? `\`${reason!.phrase}\``
                                          : `\`${reason!.phrase}\` = \`${reason!.found}\``
                                })`,
                                color,
                                fields: [
                                    { name: "Context", value: context.substring(-1024) },
                                    { name: "Source", value: `[Jump!](${message.url})` },
                                ],
                                url: message.url,
                            },
                        ],
                    })
                    .catch(() => {});

                if (sent) lastHighlighted.set(`${message.channel.id}/${member.id}`, now);
            }
        })
        .commands((x) =>
            x
                .slash((x) =>
                    x
                        .key("highlight list")
                        .description("list your highlights and show your highlight settings")
                        .fn(async ({ _ }) => {
                            const highlights = await db.highlights.findOne({ guild: _.guild!.id, user: _.user.id });

                            const phrases = highlights?.phrases ?? [];
                            const replies = highlights?.replies ?? false;
                            const delay = highlights?.delay ?? 300000;
                            const cooldown = highlights?.delay ?? 300000;

                            return {
                                embeds: [
                                    {
                                        title: "Highlights",
                                        description: `${
                                            phrases.length === 0
                                                ? "You have no phrases highlighted."
                                                : `You have the following highlighted:\n\n${phrases.map((phrase) => `- \`${phrase}\``).join("\n")}`
                                        }\n\nYou have reply highlighting ${replies ? "on" : "off"}`,
                                        color: colors.prompts.info,
                                        fields: [
                                            {
                                                name: "Delay",
                                                value: delay
                                                    ? `The bot will wait until you have not sent any messages in a channel ${formatDuration(
                                                          delay,
                                                      )} before notifying you.`
                                                    : "The bot will notify you of all highlights even if you are active in the channel.",
                                            },
                                            {
                                                name: "Cooldown",
                                                value: cooldown
                                                    ? `The bot will not notify you for the same channel within ${formatDuration(cooldown)}`
                                                    : "The bot will notify you for all highlighted messages without any cooldown.",
                                            },
                                        ],
                                    },
                                ],
                            };
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight clear")
                        .description("clear all of your highlights")
                        .fn(async ({ _ }) => {
                            await db.highlights.updateOne({ guild: _.guild!.id, user: _.user.id }, { $set: { phrases: [], replies: false } });
                            return template.success("Your highlighted phrases have been cleared.");
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight add")
                        .description("add a word/phrase to your highlights")
                        .stringOption("word-or-phrase", "the word or phrase to add", { required: true, maxLength: 75 })
                        .fn(async ({ _, "word-or-phrase": phrase }) => {
                            const display = phrase.replaceAll(/\s+/g, " ");
                            const match = stem(display).join(" ");

                            if (match.length < 3) throw "Please highlight a longer word/phrase.";

                            const highlights = await db.highlights.findOne({ guild: _.guild!.id, user: _.user.id });
                            const found = highlights?.phrases?.includes(match);

                            if (found)
                                throw `You already have that phrase highlighted${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`;

                            if ((highlights?.phrases?.length ?? 0) >= 50) throw "You have reached the per-server limit of 50 highlighted phrases.";

                            await db.highlights.updateOne({ guild: _.guild!.id, user: _.user.id }, { $addToSet: { phrases: match } }, { upsert: true });

                            return template.success(
                                `Added \`${display}\` to your highlights${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`,
                            );
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight remove")
                        .description("remove a word/phrase from your highlights")
                        .stringOption("word-or-phrase", "the word or phrase to remove", { required: true, maxLength: 75 })
                        .fn(async ({ _, "word-or-phrase": phrase }) => {
                            const display = phrase.replaceAll(/\s+/g, " ");
                            const match = stem(display).join(" ");

                            if (match.length < 3) throw "You do not have that phrase highlighted.";

                            const highlights = await db.highlights.findOne({ guild: _.guild!.id, user: _.user.id });
                            const found = highlights?.phrases?.includes(match);

                            if (!found) throw "You do not have that phrase highlighted.";

                            await db.highlights.updateOne({ guild: _.guild!.id, user: _.user.id }, { $pull: { phrases: match } }, { upsert: true });

                            return template.success(
                                `Removed \`${display}\` from your highlights${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`,
                            );
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight replies")
                        .description("toggle highlighting no-ping replies")
                        .booleanOption("highlight", "if true, highlight if someone replies to your message without pinging", { required: true })
                        .fn(async ({ _, highlight }) => {
                            await db.highlights.updateOne({ guild: _.guild!.id, user: _.user.id }, { $set: { replies: highlight } }, { upsert: true });
                            return template.success(`${highlight ? "Enabled" : "Disabled"} highlighting for no-ping replies.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight block user")
                        .description("highlight-block a user")
                        .userOption("user", "the user to block", { required: true })
                        .fn(async ({ _, user }) => {
                            const doc = await db.highlights.findOneAndUpdate(
                                { guild: _.guild!.id, user: _.user.id },
                                { $addToSet: { blockedUsers: user.id } },
                                { upsert: true },
                            );

                            if (doc?.blockedUsers?.includes(user.id)) throw `You already have ${user} blocked for highlights.`;
                            return template.success(`Blocked highlights from ${user}.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight block channel")
                        .description("highlight-block a channel")
                        .channelOption("channel", "the channel to block", { required: true, channelTypes: textlike })
                        .fn(async ({ _, channel }) => {
                            const doc = await db.highlights.findOneAndUpdate(
                                { guild: _.guild!.id, user: _.user.id },
                                { $addToSet: { blockedChannels: channel.id } },
                                { upsert: true },
                            );

                            if (doc?.blockedChannels?.includes(channel.id)) throw `You already have ${channel} blocked for highlights.`;
                            return template.success(`Blocked highlights in ${channel}.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight unblock user")
                        .description("highlight-unblock a user")
                        .userOption("user", "the user to unblock", { required: true })
                        .fn(async ({ _, user }) => {
                            const doc = await db.highlights.findOneAndUpdate(
                                { guild: _.guild!.id, user: _.user.id },
                                { $pull: { blockedUsers: user.id } },
                                { upsert: true },
                            );

                            if (!doc?.blockedUsers?.includes(user.id)) throw `You already do not have ${user} blocked for highlights.`;
                            return template.success(`Unblocked highlights from ${user}.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight unblock channel")
                        .description("highlight-unblock a channel")
                        .channelOption("channel", "the channel to unblock", { required: true, channelTypes: textlike })
                        .fn(async ({ _, channel }) => {
                            const doc = await db.highlights.findOneAndUpdate(
                                { guild: _.guild!.id, user: _.user.id },
                                { $addToSet: { blockedChannels: channel.id } },
                                { upsert: true },
                            );

                            if (!doc?.blockedChannels?.includes(channel.id)) throw `You already do not have ${channel} blocked for highlights.`;
                            return template.success(`Unblocked highlights in ${channel}.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight block list")
                        .description("list your blocked users and channels")
                        .fn(async ({ _ }) => {
                            const highlights = await db.highlights.findOne({ guild: _.guild!.id, user: _.user.id });

                            const blockedUsers = (highlights?.blockedUsers ?? []).filter((x) => _.guild!.members.cache.has(x));
                            const blockedChannels = (highlights?.blockedChannels ?? []).filter((x) => _.guild!.channels.cache.has(x));

                            try {
                                await _.reply({
                                    embeds: [
                                        {
                                            title: "Highlight Block List",
                                            color: colors.prompts.info,
                                            fields: [
                                                { name: "Blocked Members", value: blockedUsers.map((x) => `<@${x}>`).join(", ") || "(none)" },
                                                { name: "Blocked Channels", value: blockedChannels.map((x) => `<#${x}>`).join(", ") || "(none)" },
                                            ],
                                        },
                                    ],
                                    ephemeral: true,
                                });
                            } catch {
                                await _.reply({
                                    files: [
                                        {
                                            name: "blocklist.txt",
                                            attachment: Buffer.from(
                                                `Blocked Members: ${
                                                    blockedUsers.map((x) => _.guild!.members.cache.get(x)?.user.tag ?? `(unknown user: ${x})`).join(", ") ||
                                                    "(none)"
                                                }\n\nBlocked Channels: ${
                                                    blockedChannels.map((x) => _.guild!.channels.cache.get(x)?.name ?? `(unknown channel: ${x})`).join(", ") ||
                                                    "(none)"
                                                }`,
                                                "utf-8",
                                            ),
                                        },
                                    ],
                                    ephemeral: true,
                                });
                            }
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight unblock all")
                        .description("clear your highlight block list")
                        .fn(async ({ _ }) => {
                            await db.highlights.updateOne({ guild: _.guild!.id, user: _.user.id }, { $set: { blockedUsers: [], blockedChannels: [] } });
                            return template.success("Cleared your highlight block list.");
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight delay")
                        .description("set the highlight delay (inactivity required before highlighting)")
                        .stringOption("duration", "the new delay (default: 5 minutes)", { required: true })
                        .fn(async ({ _, duration: _duration }) => {
                            const duration = parseDuration(_duration);
                            if (duration === Infinity) throw "The duration must be finite.";

                            await db.highlights.findOneAndUpdate({ guild: _.guild!.id, user: _.user.id }, { $set: { delay: duration } }, { upsert: true });

                            return template.success(
                                `The bot will wait ${formatDuration(duration)} after you send a message before it can highlight you in that channel.`,
                            );
                        }),
                )
                .slash((x) =>
                    x
                        .key("highlight cooldown")
                        .description("set the highlight cooldown (cooldown between consecutive highlights)")
                        .stringOption("duration", "the new cooldown (default: 5 minutes)", { required: true })
                        .fn(async ({ _, duration: _duration }) => {
                            const duration = parseDuration(_duration);
                            if (duration === Infinity) throw "The duration must be finite.";

                            await db.highlights.findOneAndUpdate({ guild: _.guild!.id, user: _.user.id }, { $set: { cooldown: duration } }, { upsert: true });

                            return template.success(`The bot will wait ${formatDuration(duration)} between consecutive highlights in the same channel.`);
                        }),
                ),
        );

const lastSeen = new Map<string, number>();
const lastHighlighted = new Map<string, number>();
