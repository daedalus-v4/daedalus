import type { FEAutorolesSettings, FEData } from "$lib/types.js";
import type { DbAutorolesSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fAutorolesSettings(fe: FEData, data: Partial<DbAutorolesSettings> | null): Promise<FEAutorolesSettings> {
    return defaults(data, { roles: [] });
}

export async function f2bAutorolesSettings(data: FEAutorolesSettings): Promise<DbAutorolesSettings> {
    return data;
}
