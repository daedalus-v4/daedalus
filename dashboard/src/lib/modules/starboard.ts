import type { FEData, FEStarboardSettings } from "$lib/types.js";
import type { DbStarboardSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fStarboardSettings(fe: FEData, data: Partial<DbStarboardSettings> | null): Promise<FEStarboardSettings> {
    return {
        ...defaults(data, { detectEmoji: "⭐", defaultChannel: null, defaultThreshold: 5, channels: {} }),
        channels: Object.fromEntries(
            fe.channels.map((ch) => [ch.id, data?.channels?.[ch.id] ?? { disable: false, overrideChannel: null, overrideThreshold: null }]),
        ),
    };
}

export async function f2bStarboardSettings(data: FEStarboardSettings): Promise<DbStarboardSettings> {
    if (
        (data.defaultThreshold !== null && data.defaultThreshold < 2) ||
        Object.values(data.channels).some((ch) => ch.overrideThreshold !== null && ch.overrideThreshold < 2)
    )
        throw "Thresholds must be at least 2.";

    return data;
}
