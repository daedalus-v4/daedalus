import type { FEData, FEReportsSettings } from "$lib/types.js";
import type { DbReportsSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fReportsSettings(fe: FEData, data: Partial<DbReportsSettings> | null): Promise<FEReportsSettings> {
    return defaults(data, { outputChannel: null, anonymous: false, pingRoles: [], viewRoles: [] });
}

export async function f2bReportsSettings(data: FEReportsSettings): Promise<DbReportsSettings> {
    return data;
}
