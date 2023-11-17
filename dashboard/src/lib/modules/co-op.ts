import type { FECoOpSettings, FEData } from "$lib/types.js";
import type { DbCoOpSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fCoOpSettings(fe: FEData, data: Partial<DbCoOpSettings> | null): Promise<FECoOpSettings> {
    return defaults(data, { worldLevelRoles: new Array(9).fill(null), regionRoles: new Array(4).fill(null), helperRoles: new Array(4).fill(null) });
}

export async function f2bCoOpSettings(data: FECoOpSettings): Promise<DbCoOpSettings> {
    return data;
}
