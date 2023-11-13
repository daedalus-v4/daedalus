import type { FECustomRolesSettings, FEData } from "$lib/types.js";
import type { DbCustomRolesSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fCustomRolesSettings(fe: FEData, data: Partial<DbCustomRolesSettings> | null): Promise<FECustomRolesSettings> {
    return defaults(data, { allowBoosters: false, allowedRoles: [], anchor: null });
}

export async function f2bCustomRolesSettings(data: FECustomRolesSettings): Promise<DbCustomRolesSettings> {
    return data;
}
