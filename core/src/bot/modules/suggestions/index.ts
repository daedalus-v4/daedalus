import Argentium from "argentium";
import { db } from "shared/db.js";
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
                    .stringOption("explanation", "an explanation to provide for the status update")
                    .booleanOption("dm", "if true, DM the suggestion author informing them of the update")
                    .booleanOption("anon", "if true, your identity will be hidden in the suggestion embed")
                    .fn(async ({ _, status }) => {}),
            ),
    );
