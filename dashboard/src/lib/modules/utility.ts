import type { FEData, FEUtilitySettings } from "$lib/types.js";
import type { DbUtilitySettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fUtilitySettings(fe: FEData, data: Partial<DbUtilitySettings> | null): Promise<FEUtilitySettings> {
    return defaults(data, { blockRolesByDefault: false, allowedRoles: [], blockedRoles: [], bypassRoles: [] });
}

export async function f2bUtilitySettings(data: FEUtilitySettings): Promise<DbUtilitySettings> {
    return data;
}
