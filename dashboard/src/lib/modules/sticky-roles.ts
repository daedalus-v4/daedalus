import type { FEData, FEStickyRolesSettings } from "$lib/types.js";
import type { DbStickyRolesSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fStickyRolesSettings(fe: FEData, data: Partial<DbStickyRolesSettings> | null): Promise<FEStickyRolesSettings> {
    return defaults(data, { exclude: [] });
}

export async function f2bStickyRolesSettings(data: FEStickyRolesSettings): Promise<DbStickyRolesSettings> {
    return data;
}
