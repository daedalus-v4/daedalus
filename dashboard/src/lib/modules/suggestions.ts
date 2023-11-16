import type { FEData, FESuggestionsSettings } from "$lib/types.js";
import type { DbSuggestionsSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fSuggestionsSettings(fe: FEData, data: Partial<DbSuggestionsSettings> | null): Promise<FESuggestionsSettings> {
    return defaults(data, { outputChannel: null, anonymous: false });
}

export async function f2bSuggestionsSettings(data: FESuggestionsSettings): Promise<DbSuggestionsSettings> {
    return data;
}
