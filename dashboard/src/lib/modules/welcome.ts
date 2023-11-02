import type { FEData, FEWelcomeSettings } from "$lib/types.js";
import type { DbWelcomeSettings } from "shared";
import { b2fMessage, defaultMessage, f2bMessage, nometa } from "./utils.js";

export async function b2fWelcomeSettings(fe: FEData, data: Partial<DbWelcomeSettings> | null): Promise<FEWelcomeSettings> {
    return { channel: data?.channel ?? null, message: b2fMessage(data?.message ?? defaultMessage) };
}

export async function f2bWelcomeSettings(data: FEWelcomeSettings): Promise<DbWelcomeSettings> {
    return nometa({ channel: data.channel, message: f2bMessage(data.message) });
}

export function diffWelcomeSettings(x: FEWelcomeSettings, y: FEWelcomeSettings): boolean {
    return JSON.stringify(nometa(x)) != JSON.stringify(nometa(y));
}
