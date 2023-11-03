import type { FEData, FELoggingSettings } from "$lib/types.js";
import { logCategories, logEvents, type DbLoggingSettings } from "shared";

function checkWebhook(input: string, context: string): string {
    input = input.trim();

    if (!input.match(/^(https:\/\/discord\.com\/api\/webhooks\/[1-9][0-9]{16,19}\/.+)?$/))
        throw `Invalid webhook URL format (${context}). Please ensure you have copy-pasted your URL correctly.`;

    return input;
}

export async function b2fLoggingSettings(fe: FEData, data: Partial<DbLoggingSettings> | null): Promise<FELoggingSettings> {
    const output: FELoggingSettings = {
        useWebhook: data?.useWebhook ?? false,
        defaultChannel: data?.defaultChannel ?? null,
        defaultWebhook: data?.defaultWebhook ?? "",
        ignoredChannels: data?.ignoredChannels ?? [],
        filesOnly: data?.filesOnly ?? false,
        categories: {},
    };

    for (const key of Object.keys(logCategories)) {
        const category = data?.categories?.[key];

        output.categories[key] = {
            enabled: category?.enabled ?? false,
            useWebhook: category?.useWebhook ?? false,
            outputChannel: category?.outputChannel ?? null,
            outputWebhook: category?.outputWebhook ?? "",
            events: {},
        };

        for (const ekey of Object.entries(logEvents)
            .filter(([, { category }]) => category === key)
            .map(([key]) => key)) {
            const event = category?.events?.[ekey];

            output.categories[key].events[ekey] = {
                enabled: event?.enabled ?? true,
                useWebhook: event?.useWebhook ?? false,
                outputChannel: event?.outputChannel ?? null,
                outputWebhook: event?.outputWebhook ?? "",
            };
        }
    }

    return output;
}

export async function f2bLoggingSettings(data: FELoggingSettings): Promise<DbLoggingSettings> {
    if (data.useWebhook) data.defaultWebhook = checkWebhook(data.defaultWebhook, "default webhook");

    for (const [key, category] of Object.entries(data.categories)) {
        if (category.useWebhook) category.outputWebhook = checkWebhook(category.outputWebhook, `webhook for category ${logCategories[key]}`);

        for (const [ekey, event] of Object.entries(category.events))
            if (event.useWebhook)
                event.outputWebhook = checkWebhook(event.outputWebhook, `webhook for event ${logEvents[ekey]} in category ${logCategories[key]}`);
    }

    return data;
}
