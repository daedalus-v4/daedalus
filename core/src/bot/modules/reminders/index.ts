import Argentium from "argentium";
import { DbTask, parseDuration } from "shared";
import { autoIncrement, db } from "shared/db.js";
import { colors, template, timeinfo } from "../../lib/format.js";

export default (app: Argentium) =>
    app.allowInDms("reminder").commands((x) =>
        x
            .slash((x) =>
                x
                    .key("reminder set")
                    .description("set a reminder")
                    .stringOption("duration", "how long to wait before reminding you", { required: true })
                    .stringOption("query", "the reminder message to include", { maxLength: 1024 })
                    .fn(async ({ _, duration: _duration, query }) => {
                        if ((await db.tasks.countDocuments({ action: "remind", user: _.user.id })) >= 20)
                            throw "You have reached the global reminder limit (20).";

                        const duration = parseDuration(_duration, true);
                        if (duration === 0) throw "You must set the reminder in the future.";
                        if (duration === Infinity) throw "You must set the duration to a finite amount of time.";

                        const time = Date.now() + duration;
                        const id = await autoIncrement(`reminders/${_.user.id}`);

                        const reply = await _.reply({
                            embeds: [
                                {
                                    title: `Reminder Set (#${id})`,
                                    description: `You will be reminded on ${timeinfo(time)}${
                                        query ? ` about ${query.length > 256 ? `${query.slice(0, 253)}...` : query}` : ""
                                    }`,
                                    color: colors.statuses.success,
                                },
                            ],
                            fetchReply: true,
                        });

                        await db.tasks.insertOne({ action: "remind", guild: _.guild?.id ?? null, id, user: _.user.id, query, origin: reply.url, time });
                    }),
            )
            .slash((x) =>
                x
                    .key("reminder list")
                    .description("list your reminders")
                    .booleanOption("all", "if true, list reminders that you set in other servers")
                    .fn(async ({ _, all }) => {
                        all ??= !_.guild;

                        const reminders = (await db.tasks
                            .find({ action: "remind", user: _.user.id, ...(all ? {} : { guild: _.guild?.id ?? null }) })
                            .toArray()) as (DbTask & { action: "remind" })[];

                        if (reminders.length === 0) return template.info(`You have no reminders${all ? "" : " in this server"}.`);

                        return {
                            embeds: [
                                {
                                    title: "Reminders",
                                    description: reminders
                                        .map(
                                            (x) =>
                                                `- \`${x.id}\`: [here](${x.origin}) at ${timeinfo(x.time)}${
                                                    x.query ? `: ${x.query.length > 100 ? `${x.query.slice(0, 97)}...}` : x.query}` : ""
                                                }`,
                                        )
                                        .join("\n"),
                                    color: colors.prompts.info,
                                },
                            ],
                        };
                    }),
            )
            .slash((x) =>
                x
                    .key("reminder cancel")
                    .description("delete a reminder")
                    .numberOption("id", "the ID of the reminder to delete", { required: true, minimum: 1 })
                    .fn(async ({ _, id }) => {
                        const entry = await db.tasks.findOneAndDelete({ action: "remind", user: _.user.id, id });
                        if (!entry) throw "That reminder does not exist.";
                        return template.success(`Deleted reminder #${id} set [here](${(entry as DbTask & { action: "remind" }).origin}).`);
                    }),
            ),
    );
