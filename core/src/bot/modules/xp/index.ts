import Argentium from "argentium";
import { APIEmbedField, BaseMessageOptions, ComponentType, Events, MessageType } from "discord.js";
import { db, getColor } from "shared/db.js";
import { log } from "../../../lib/log.js";
import { mdash, template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";
import { skip } from "../utils.js";
import { addXp, drawRankcard, isChannelBlocked, isUserBlocked } from "./utils.js";

let lastMessage: Record<string, number> = {};

export default (app: Argentium) =>
    app
        .on(Events.MessageCreate, async (message) => {
            if (!message.guild) return;
            if (message.author.bot) return;
            if (![MessageType.Default, MessageType.Reply].includes(message.type)) return;
            if (await skip(message.guild, "xp")) return;

            const settings = await db.xpSettings.findOne({ guild: message.guild.id });
            if ((await isChannelBlocked(message.channel, settings)) || (await isUserBlocked(message.member, settings))) return;

            const now = Date.now();
            if (lastMessage[message.author.id] && now - lastMessage[message.author.id] < 60000) return;
            lastMessage[message.author.id] = now;

            await addXp(message.channel, message.member!, 1, 0, settings);
        })
        .commands((x) =>
            x
                .slash((x) =>
                    x
                        .key("rank")
                        .description("get a user's XP and rank")
                        .userOption("user", "the user (default: yourself)")
                        .fn(defer(false))
                        .fn(async ({ _, user }) => {
                            user ??= _.user;

                            try {
                                await _.editReply(await drawRankcard(_.guild!, user));

                                // await _.editReply({
                                //     files: [{ name: `${user.id}-rankcard.png`, contentType: "image/png", attachment: await drawRankcard(_.guild!, user) }],
                                // });
                            } catch (error) {
                                await _.editReply(
                                    template.error("Sorry, something went wrong displaying your rank card. Please contact support if this issue persists."),
                                );

                                log.error(error, "d06905f5-7c49-40e8-a0fa-961d4f8f4849");
                            }
                        }),
                )
                .slash((x) =>
                    x
                        .key("top")
                        .description("get top users by XP")
                        .stringOption("type", "return only text or voice XP (default: both)", { choices: { text: "text", voice: "voice", both: "both" } })
                        .stringOption("range", "the time range to return", {
                            choices: { total: "all-time", monthly: "monthly", weekly: "weekly", daily: "daily" },
                        })
                        .numberOption("page", "the page to return", { minimum: 1 })
                        .fn(defer(false))
                        .fn(async ({ _, type, range, page }): Promise<BaseMessageOptions> => {
                            type ??= "both";
                            page ??= 1;

                            const entries = await db.xpAmounts.find({ guild: _.guild!.id }).toArray();
                            const absent = !entries.some((x) => x.user === _.user.id);

                            const fields: APIEmbedField[] = [];
                            const blocksize = type === "both" ? 5 : 10;
                            const min = (page - 1) * blocksize;
                            const max = page * blocksize;

                            for (const key of ["text", "voice"] as const)
                                if (key === type || type === "both") {
                                    const list = entries
                                        .map((x) => ({ user: x.user, xp: x[range ?? "total"][key] }))
                                        .filter((x) => x.user === _.user.id || x.xp > 0)
                                        .sort((a, b) => b.xp - a.xp)
                                        .concat(absent ? [{ user: _.user.id, xp: 0 }] : [])
                                        .map<[{ user: string; xp: number }, number]>((x, i) => [x, i + 1])
                                        .filter(([x, i]) => x.user === _.user.id || (min < i && i <= max));

                                    const digits = list.length > 0 ? `${list.at(-1)![1]}`.length : 0;

                                    fields.push({
                                        name: `${{ text: "Text", voice: "Voice" }[key]} [${page} / ${Math.ceil(entries.length / blocksize)}]`,
                                        value:
                                            list
                                                .map(([x, i]) =>
                                                    (x.user === _.user.id ? ["**", "**"] : ["", ""]).join(
                                                        `\`#${`${i}`.padStart(digits)}.\` <@${x.user}> ${mdash} \`${Math.floor(x.xp)}\``,
                                                    ),
                                                )
                                                .join("\n") || "(nothing here)",
                                        inline: true,
                                    });
                                }

                            return {
                                embeds: [
                                    {
                                        title: `:clipboard: ${
                                            { total: "All-Time", monthly: "Monthly", weekly: "Weekly", daily: "Daily" }[range ?? "total"]
                                        } XP Leaderboard`,
                                        fields,
                                        color: await getColor(_.guild!),
                                        footer: { text: _.user.tag, icon_url: _.guild!.members.cache.get(_.user.id)?.displayAvatarURL({ size: 64 }) },
                                        timestamp: new Date().toISOString(),
                                    },
                                ],
                            };
                        }),
                )
                .slash((x) =>
                    x
                        .key("xp reset")
                        .description("irreversibly reset a user's XP back to 0")
                        .userOption("user", "the user to reset", { required: true })
                        .fn(async ({ _, user }) =>
                            template.confirm(`Confirm that you want to reset ${user}'s XP. This action is **irreversible**.`, _.user.id, `xp/reset:${user.id}`),
                        ),
                )
                .slash((x) =>
                    x
                        .key("xp mee6-import")
                        .description("import XP from MEE6")
                        .fn(
                            async ({ _ }): Promise<BaseMessageOptions> => ({
                                embeds: [
                                    {
                                        title: "**MEE6 XP Import**",
                                        description: `You are about to import XP from MEE6. Before you proceed, please **read the following carefully**, otherwise this will not work.\n- MEE6 must still be in your server.\n- Your MEE6 leaderboard must be public: [MEE6 Dashboard](https://mee6.xyz/en/dashboard/${
                                            _.guild!.id
                                        }/leaderboard).\n\nPlease select the import mode:\n- **Add** (recommended) will combine any existing Daedalus XP with incoming MEE6 XP.\n- **Replace** will wipe all Daedalus XP and replace it with MEE6's.\n- **Keep** will only import MEE6 XP for users with no Daedalus XP.\n\nDaedalus voice XP is not affected. Select **CANCEL** to end this operation without doing anything. **This action cannot be reversed.**`,
                                        color: await getColor(_.guild!),
                                    },
                                ],
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.StringSelect,
                                                customId: `:${_.user.id}:xp/mee6-import/index`,
                                                options: ["Add", "Replace", "Keep", "Cancel"].map((x) => ({ label: x, value: x.toLowerCase() })),
                                            },
                                        ],
                                    },
                                ],
                            }),
                        ),
                ),
        );

setInterval(
    () => {
        const now = Date.now();
        lastMessage = Object.fromEntries(Object.entries(lastMessage).filter(([, v]) => now - v < 60000));
    },
    60 * 60 * 1000,
);
