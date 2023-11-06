import type { FEData, FEReactionRolesSettings } from "$lib/types.js";
import type { DbReactionRolesSettings } from "shared";
import { b2fMessage, f2bMessage } from "./utils.js";

export async function b2fReactionRolesSettings(fe: FEData, data: Partial<DbReactionRolesSettings> | null): Promise<FEReactionRolesSettings> {
    return { entries: (data?.entries ?? []).map((entry) => ({ ...entry, promptMessage: b2fMessage(entry.promptMessage) })) };
}

export async function f2bReactionRolesSettings(data: FEReactionRolesSettings): Promise<DbReactionRolesSettings> {
    return { entries: data.entries.map((entry) => ({ ...entry, promptMessage: f2bMessage(entry.promptMessage) })) };
}
