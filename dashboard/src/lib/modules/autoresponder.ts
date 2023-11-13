import type { FEAutoresponderSettings, FEData } from "$lib/types.js";
import type { DbAutoresponderSettings } from "shared";
import { b2fMessage, defaults, f2bMessage } from "./utils.js";

export async function b2fAutoresponderSettings(fe: FEData, data: Partial<DbAutoresponderSettings> | null): Promise<FEAutoresponderSettings> {
    const dataWithDefaults = defaults(data, {
        onlyInAllowedChannels: false,
        onlyToAllowedRoles: false,
        allowedChannels: [],
        allowedRoles: [],
        blockedChannels: [],
        blockedRoles: [],
        triggers: [],
    });

    return { ...dataWithDefaults, triggers: dataWithDefaults.triggers.map((item) => ({ ...item, message: b2fMessage(item.message) })) };
}

export async function f2bAutoresponderSettings(data: FEAutoresponderSettings): Promise<DbAutoresponderSettings> {
    if (data.triggers.some((x) => x.match.trim().length === 0)) throw "All triggers must have a non-empty match string.";
    return { ...data, triggers: data.triggers.map((item) => ({ ...item, message: f2bMessage(item.message) })) };
}
