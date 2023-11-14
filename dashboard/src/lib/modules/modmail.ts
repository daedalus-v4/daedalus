import type { FEData, FEModmailSettings } from "$lib/types.js";
import { parseCustomMessageString, type DbModmailSettings } from "shared";

export async function b2fModmailSettings(fe: FEData, data: Partial<DbModmailSettings> | null): Promise<FEModmailSettings> {
    const output = {
        multi: data?.multi ?? false,
        snippets: (data?.snippets ?? []) as FEModmailSettings["snippets"],
        targets: (data?.targets ?? []) as FEModmailSettings["targets"],
    };

    if (!output.multi && output.targets.length === 0)
        output.targets = [
            {
                id: Math.random(),
                name: "Default Target",
                description: "Replace/remove this description.",
                emoji: null,
                logChannel: null,
                category: null,
                pingRoles: [],
                pingHere: false,
                useThreads: true,
                accessRoles: [],
                openMessage: "",
                closeMessage: "",
            },
        ];

    return output;
}

export async function f2bModmailSettings(data: FEModmailSettings): Promise<DbModmailSettings> {
    if (data.targets.some((x) => x.name.trim().length === 0)) throw "All targets must be named.";
    if (data.snippets.length > new Set(data.snippets.map((x) => x.name.trim())).size) throw "Snippet names must be unique.";

    return {
        multi: data.multi,
        snippets: data.snippets.map((x) => ({ ...x, parsed: parseCustomMessageString(x.content) })),
        targets: data.targets.map((target) => ({
            ...target,
            openMessageParsed: parseCustomMessageString(target.openMessage),
            closeMessageParsed: parseCustomMessageString(target.closeMessage),
        })),
    };
}
