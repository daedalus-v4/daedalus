import Argentium from "argentium";
import { BaseMessageOptions, ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { db } from "shared/db.js";
import { log } from "../../../lib/log.js";
import { getAllClients } from "../../clients.js";
import confirm from "../../lib/confirm.js";
import { template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";

export default (app: Argentium) =>
    app.allowInDms("admin").commands((x) =>
        x
            .beforeAll(async ({ _, ...data }, escape) => {
                if (_.user.id === Bun.env.OWNER) return;

                if ((await db.admins.countDocuments({ user: _.user.id })) === 0) {
                    log.warn(
                        { command: _.isChatInputCommand() ? _.options.getSubcommand() : null, data },
                        `${_.user.id} attempted to use an admin command while unauthorized:`,
                    );

                    escape(template.error("You are not a Daedalus admin."));
                }
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
            )
            .slash((x) =>
                x
                    .key("admin broadcast")
                    .description("broadcast a message to all server owners through DMs")
                    .fn(async ({ _ }) => {
                        await _.showModal({
                            title: "Broadcast",
                            customId: "broadcast",
                            components: [
                                {
                                    type: ComponentType.ActionRow,
                                    components: [
                                        {
                                            type: ComponentType.TextInput,
                                            style: TextInputStyle.Paragraph,
                                            label: "Content",
                                            customId: "content",
                                            required: true,
                                        },
                                    ],
                                },
                            ],
                        });

                        const modal = await _.awaitModalSubmit({ time: 60 * 60 * 1000 }).catch(() => {});
                        if (!modal) return;

                        if (_.user.id !== Bun.env.OWNER && (await db.admins.countDocuments({ user: _.user.id })) === 0)
                            return void (await modal.reply(template.error("You are no longer a Daedalus admin.")));

                        await modal.deferReply({ ephemeral: true });

                        const clients = getAllClients();
                        const _guilds = (await Promise.all(clients.map(async (x) => (await x.guilds.fetch()).toJSON()))).flat();
                        const guilds = await Promise.all(_guilds.map((x) => x.fetch()));
                        const users = await Promise.all(guilds.map((x) => x.fetchOwner()));

                        const seen = new Set((await db.accountSettings.find({ suppressAdminBroadcasts: true }).toArray()).map((x) => x.user));

                        const targets = users.filter((x) => {
                            if (seen.has(x.id)) return false;
                            seen.add(x.id);
                            return true;
                        });

                        const response = await confirm(
                            modal,
                            {
                                embeds: [
                                    {
                                        title: `Confirm broadcasting to ${targets.length} user${targets.length === 1 ? "" : "s"}?`,
                                        description: "This operation will not be cancelable.",
                                        color: 0x009688,
                                    },
                                ],
                            },
                            300000,
                        );

                        if (!response) return;

                        if (_.user.id !== Bun.env.OWNER && (await db.admins.countDocuments({ user: _.user.id })) === 0)
                            return void (await response.update(template.error("You are no longer a Daedalus admin.")));

                        await response.deferUpdate();

                        let failed = 0;
                        for (const member of targets)
                            await member
                                .send({
                                    embeds: [
                                        {
                                            title: "Broadcast from Daedalus Administration",
                                            description: modal.fields.getTextInputValue("content"),
                                            color: 0x009688,
                                            footer: {
                                                text: "This message was sent to you because you own a server that is using Daedalus. We only send these messages for crucial information that requires your immediate attention. We sincerely apologize for this disruption. If you would like to never receive these messages again, please click the button below to go to your account management page and suppress admin broadcasts.",
                                            },
                                        },
                                    ],
                                    components: [
                                        {
                                            type: ComponentType.ActionRow,
                                            components: [
                                                {
                                                    type: ComponentType.Button,
                                                    style: ButtonStyle.Link,
                                                    url: `${Bun.env.DOMAIN}/account`,
                                                    label: "Account Settings",
                                                },
                                            ],
                                        },
                                    ],
                                })
                                .catch(() => {
                                    failed++;
                                });

                        await response.editReply(
                            template.success(`Broadcasted to ${targets.length - failed} user${targets.length - failed === 1 ? "" : "s"} (failed: ${failed}).`),
                        );
                    }),
            ),
    );
