import type { FEData, FEGiveawaysSettings } from "$lib/types.js";
import type { DbGiveawaysSettings } from "shared";
import { b2fMessage, defaultMessage, defaults, f2bMessage } from "./utils.js";

export async function b2fGiveawaysSettings(fe: FEData, data: Partial<DbGiveawaysSettings> | null): Promise<FEGiveawaysSettings> {
    const defaulted = defaults(data, {
        template: {
            channel: null,
            message: defaultMessage(),
            requiredRoles: [],
            requiredRolesAll: false,
            blockedRoles: [],
            blockedRolesAll: false,
            bypassRoles: [],
            bypassRolesAll: false,
            stackWeights: false,
            weights: [],
            winners: 1,
            allowRepeatWinners: false,
        },
        giveaways: [],
    });

    return {
        template: { ...defaulted.template, message: b2fMessage(defaulted.template.message) },
        giveaways: defaulted.giveaways.map((x) => ({ ...x, message: b2fMessage(x.message) })),
    };
}

export async function f2bGiveawaysSettings(data: FEGiveawaysSettings): Promise<DbGiveawaysSettings> {
    return {
        template: { ...data.template, message: f2bMessage(data.template.message, true) },
        giveaways: data.giveaways.map((x) => ({ ...x, message: f2bMessage(x.message, true) })),
    };
}
