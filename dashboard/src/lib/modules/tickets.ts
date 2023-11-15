import type { FEData, FETicketsSettings } from "$lib/types.js";
import type { DbTicketsSettings } from "shared";
import { b2fMessage, f2bMessage } from "./utils.js";

export async function b2fTicketsSettings(fe: FEData, data: Partial<DbTicketsSettings> | null): Promise<FETicketsSettings> {
    return {
        prompts: (data?.prompts ?? []).map((x) => ({
            ...x,
            prompt: b2fMessage(x.prompt),
            targets: x.targets.map((x) => ({ ...x, customOpenMessage: b2fMessage(x.customOpenMessage) })),
        })),
    };
}

export async function f2bTicketsSettings(data: FETicketsSettings): Promise<DbTicketsSettings> {
    if (data.prompts.some((x) => x.name.trim().length === 0)) throw "All prompts must have a non-empty name.";
    if (data.prompts.some((x) => !x.channel)) throw "All prompts must have a channel.";

    for (const prompt of data.prompts)
        if (prompt.multi ? prompt.targets.some((x) => x.name.trim().length === 0) : prompt.targets[0].label.trim().length === 0)
            throw prompt.multi ? "All prompt targets must have a non-empty name." : "All prompt button labels must be non-empty.";

    return {
        prompts: data.prompts.map((x) => ({
            ...x,
            prompt: f2bMessage(x.prompt, true),
            targets: x.targets.map((x) => ({ ...x, customOpenMessage: f2bMessage(x.customOpenMessage, true) })),
        })),
    };
}
