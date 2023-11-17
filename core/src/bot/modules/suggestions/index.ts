import Argentium from "argentium";
import { ButtonComponentData, ButtonStyle, ComponentType, Message } from "discord.js";
import { autoIncrement, db, getColor } from "shared/db.js";
import { mdash, template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";
import { statuses } from "./lib.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x
            .slash((x) =>
                x
                    .key("suggest")
                    .description("submit a suggestion to the server's suggestion channel")
                    .stringOption("suggestion", "the suggestion to submit", { required: true, maxLength: 1024 })
                    .fn(async ({ _, suggestion }) => {
                        const settings = await db.suggestionsSettings.findOne({ guild: _.guild!.id });
                        if (!settings?.outputChannel) throw "This server has not set up suggestions.";

                        const channel = await _.guild!.channels.fetch(settings.outputChannel).catch(() => {});
                        if (!channel?.isTextBased()) throw "This server has not configured the suggestion channel or it is missing.";

                        const caller = await _.guild!.members.fetch(_.user);
                        const id = await autoIncrement(`suggestions/${_.guild!.id}`);

                        const message = await channel
                            .send({
                                embeds: [
                                    {
                                        title: `Suggestion #${id}`,
                                        description: suggestion,
                                        color: await getColor(_.guild!),
                                        author: settings.anonymous ? undefined : { name: _.user.tag, icon_url: caller.displayAvatarURL({ size: 256 }) },
                                        footer: {
                                            text: settings.anonymous
                                                ? `Author hidden ${mdash} moderators can use the button below to view the user.`
                                                : `Suggested by ${_.user.tag} (${_.user.id})`,
                                        },
                                    },
                                ],
                                components: [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                style: ButtonStyle.Success,
                                                customId: "::suggestions/vote:yes",
                                                emoji: "⬆️",
                                                label: "0",
                                            },
                                            {
                                                type: ComponentType.Button,
                                                style: ButtonStyle.Danger,
                                                customId: "::suggestions/vote:no",
                                                emoji: "⬇️",
                                                label: "0",
                                            },
                                            ...(settings.anonymous
                                                ? [
                                                      {
                                                          type: ComponentType.Button,
                                                          style: ButtonStyle.Secondary,
                                                          customId: "::suggestions/view",
                                                          label: "View Author",
                                                      } satisfies ButtonComponentData,
                                                  ]
                                                : []),
                                        ],
                                    },
                                ],
                            })
                            .catch(() => {
                                throw `Your suggestion could not be posted. There may be issues with the permissions.`;
                            });

                        await db.suggestionPosts.insertOne({
                            guild: _.guild!.id,
                            id,
                            channel: message.channel.id,
                            message: message.id,
                            user: _.user.id,
                            yes: [],
                            no: [],
                        });

                        return template.success(`Your suggestion has been posted to ${message.url}!`);
                    }),
            )
            .slash((x) =>
                x
                    .key("suggestion update")
                    .description("update a suggestion's status")
                    .stringOption("status", "the status of the suggestion", {
                        required: true,
                        choices: Object.fromEntries(Object.entries(statuses).map(([x, y]) => [x, y.name])) as Record<keyof typeof statuses, string>,
                    })
                    .numberOption("id", "the ID of the suggestion to update", { required: true, minimum: 1 })
                    .stringOption("explanation", "an explanation to provide for the status update", { maxLength: 1024 })
                    .booleanOption("dm", "if true, DM the suggestion author informing them of the update")
                    .booleanOption("anon", "if true, your identity will be hidden in the suggestion embed")
                    .fn(defer(true))
                    .fn(async ({ _, status, id, explanation, dm, anon }) => {
                        const suggestion = await db.suggestionPosts.findOne({ guild: _.guild!.id, id });
                        if (!suggestion) throw `No suggestion with ID \`${id}\`.`;

                        let message: Message;

                        try {
                            const channel = await _.guild!.channels.fetch(suggestion.channel);
                            if (!channel?.isTextBased()) throw 0;

                            message = await channel.messages.fetch(suggestion.message);
                        } catch {
                            throw "The suggestion post cannot be found; it may have been deleted.";
                        }

                        const { name, color } = statuses[status];

                        const embed = message.embeds[0].toJSON();

                        if (!embed.fields?.length) embed.fields = [{ name: "", value: "" }];
                        embed.fields[0] = { name: `**${name}**${anon ? "" : ` by ${_.user.tag}`}`, value: explanation || "_ _" };
                        embed.color = color;

                        await message.edit({ embeds: [embed] });

                        let failed = false;

                        if (dm) {
                            const member = await _.guild!.members.fetch({ user: suggestion.user, force: true }).catch(() => {});

                            if (!member) failed = true;
                            else
                                await member
                                    .send({
                                        embeds: [
                                            {
                                                title: `Suggestion #${id} ${name}`,
                                                description: `Your suggestion was ${name.toLowerCase()}${anon ? "" : ` by ${_.user}`}:\n\n${embed.description}`,
                                                color,
                                                fields: explanation ? [{ name: "Explanation", value: explanation }] : [],
                                                url: message.url,
                                            },
                                        ],
                                    })
                                    .catch(() => (failed = true));
                        }

                        return template.success(
                            `Suggestion #${id} was ${name.toLowerCase()}${
                                dm ? (failed ? " but the author could not be DM'd" : " and the author was DM'd") : ""
                            }.`,
                        );
                    }),
            ),
    );
