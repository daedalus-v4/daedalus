import type { FEData, FEXpSettings } from "$lib/types.js";
import type { DbXpSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fXpSettings(fe: FEData, data: Partial<DbXpSettings> | null): Promise<FEXpSettings> {
    return defaults(data, {
        blockedRoles: [],
        blockedChannels: [],
        bonusChannels: [],
        bonusRoles: [],
        rankCardBackground: "",
        announceLevelUp: false,
        announceInChannel: false,
        announceChannel: null,
        announcementBackground: "",
        rewards: [],
    });
}

export async function f2bXpSettings(data: FEXpSettings): Promise<DbXpSettings> {
    if ([...data.bonusChannels, ...data.bonusRoles].some((x) => x.multiplier !== null && (x.multiplier < 0 || x.multiplier > 10)))
        throw "XP multipliers must be between 0 and 10.";

    if (data.rewards.flatMap((x) => [x.text, x.voice]).some((x) => x !== null && (x % 1 !== 0 || x < 1)))
        throw "XP reward thresholds must be positive integers.";

    const channels = data.bonusChannels.map((x) => x.channel).filter((x) => x);
    const roles = data.bonusRoles.map((x) => x.role).filter((x) => x);

    if (channels.length > new Set(channels).size) throw "Duplicate channel detected in bonus channels.";
    if (roles.length > new Set(roles).size) throw "Duplicate role detected in bonus roles.";

    return data;
}
