import Argentium from "argentium";
import { BaseMessageOptions } from "discord.js";
import db from "../../../lib/db.js";
import { getToken } from "../../../premium.js";
import { template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";

export default (app: Argentium) =>
    app
        .beforeAllCommands(async ({ _ }, escape) => {
            if (!_.guild) return;
            if (_.client.token !== (await getToken(_.guild))) escape(template.error("Incorrect client in use; please use this guild's bot."));
        })
        .commands((x) =>
            x
                .beforeAll(async ({ _ }) => {
                    if (_.user.id === Bun.env.OWNER) return;
                    if ((await db.admins.countDocuments({ user: _.user.id })) === 0) return template.error("You are not a Daedalus admin.");
                })
                .slash((x) =>
                    x
                        .key("admin promote")
                        .description("promote a user to Daedalus admin")
                        .userOption("user", "the user to promote", { required: true })
                        .fn(defer(true))
                        .fn(async ({ _, user }): Promise<string | BaseMessageOptions> => {
                            if (user.id === Bun.env.OWNER) throw `${user} is the bot owner and is already an admin.`;

                            const doc = await db.admins.findOneAndUpdate({ user: user.id }, { $set: { user: user.id } }, { upsert: true });
                            if (doc) throw `${user} is already a Daedalus admin.`;

                            return template.success(`${user} is now a Daedalus admin.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("admin demote")
                        .description("demote a user from Daedalus admin")
                        .userOption("user", "the user to demote", { required: true })
                        .fn(defer(true))
                        .fn(async ({ _, user }): Promise<string | BaseMessageOptions> => {
                            if (user.id === Bun.env.OWNER) throw `${user} is the bot owner and cannot be demoted.`;

                            const doc = await db.admins.findOneAndDelete({ user: user.id });
                            if (!doc) throw `${user} is not a Daedalus admin.`;

                            return template.success(`${user} is no longer a Daedalus admin.`);
                        }),
                )
                .slash((x) =>
                    x
                        .key("admin eval")
                        .description("evaluate JS code")
                        .stringOption("code", "what to evaluate", { required: true })
                        .fn(defer(true))
                        .fn(async ({ _, code }): Promise<string | BaseMessageOptions> => {
                            const result = await Object.getPrototypeOf(async function () {}).constructor(
                                "cmd",
                                "channel",
                                "guild",
                                "me",
                                "input",
                                "db",
                                code,
                            )(
                                _,
                                _.channel,
                                _.guild,
                                _.guild ? await _.guild.members.fetch(_.user) : _.user,
                                async (full = false, others = false) => {
                                    const reply = (
                                        await _.channel!.awaitMessages(others ? { max: 1 } : { max: 1, filter: (m) => m.author.id === _.user.id })
                                    ).first()!;

                                    return full ? reply : reply.content;
                                },
                                db,
                            );

                            if (result === undefined || result === null) return { content: `\`\`\`js\n${result}\n\`\`\`` };

                            const output = JSON.stringify(result, undefined, 4);
                            const formatted = `\`\`\`json\n${output}\n\`\`\``;

                            if (formatted.length <= 2000) return { content: formatted };
                            else if (formatted.length <= 4096) return template.success(formatted);
                            else return { files: [{ name: "result.json", attachment: Buffer.from(output, "utf-8") }] };
                        }),
                ),
        );
