import type { FECountSettings, FEData } from "$lib/types.js";
import type { DbCountSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fCountSettings(fe: FEData, data: Partial<DbCountSettings> | null): Promise<FECountSettings> {
    return defaults(data, { channels: [] });
}

export async function f2bCountSettings(data: FECountSettings): Promise<DbCountSettings> {
    if (data.channels.some((x) => !x.channel)) throw "All count channels must be assigned to a channel.";
    if (data.channels.some((x) => x.interval % 1 !== 0 || x.next % 1 !== 0)) throw "Count channels must have integer intervals and values.";

    return data;
}
