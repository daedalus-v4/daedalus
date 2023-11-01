import type { FEData, FEWelcomeSettings } from "$lib/types.js";
import type { DbWelcomeSettings } from "shared";
import { defaultMessage, defaults, nometa } from "./utils.js";

export async function b2fWelcomeSettings(fe: FEData, data: Partial<DbWelcomeSettings> | null): Promise<FEWelcomeSettings> {
    return defaults<FEWelcomeSettings>(data, { channel: null, message: defaultMessage });
}

export async function f2bWelcomeSettings(data: FEWelcomeSettings): Promise<DbWelcomeSettings> {
    return nometa(data);
}

export function diffWelcomeSettings(x: FEWelcomeSettings, y: FEWelcomeSettings): boolean {
    return JSON.stringify(nometa(x)) != JSON.stringify(nometa(y));
}
