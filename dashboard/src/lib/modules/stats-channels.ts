import type { FEData, FEStatsChannelsSettings } from "$lib/types.js";
import { parseCustomMessageString, type DbStatsChannelsSettings } from "shared";

export async function b2fStatsChannelsSettings(fe: FEData, data: Partial<DbStatsChannelsSettings> | null): Promise<FEStatsChannelsSettings> {
    return { channels: data?.channels ?? [] };
}

export async function f2bStatsChannelsSettings(data: FEStatsChannelsSettings): Promise<DbStatsChannelsSettings> {
    return { channels: data.channels.map((item) => ({ ...item, parsed: parseCustomMessageString(item.format) })) };
}
