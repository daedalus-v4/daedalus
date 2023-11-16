import type { FEData, FENukeguardSettings } from "$lib/types.js";
import type { DbNukeguardSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fNukeguardSettings(fe: FEData, data: Partial<DbNukeguardSettings> | null): Promise<FENukeguardSettings> {
    return defaults(data, {
        alertChannel: null,
        pingRoles: [],
        pingHere: false,
        exemptedRoles: [],
        watchChannelsByDefault: false,
        ignoredChannels: [],
        watchedChannels: [],
        watchRolesByDefault: false,
        ignoredRoles: [],
        watchedRoles: [],
        watchEmojiByDefault: false,
        ignoredEmoji: [],
        watchedEmoji: [],
        watchStickersByDefault: false,
        ignoredStickers: [],
        watchedStickers: [],
        watchSoundsByDefault: false,
        ignoredSounds: [],
        watchedSounds: [],
        preventWebhookCreation: false,
        watchWebhookDeletion: false,
        ratelimitEnabled: false,
        ratelimitKicks: false,
        threshold: null,
        timeInSeconds: null,
        restrictRolesLenientMode: false,
        restrictRolesBlockByDefault: false,
        restrictRolesAllowedRoles: [],
        restrictRolesBlockedRoles: [],
    });
}

export async function f2bNukeguardSettings(data: FENukeguardSettings): Promise<DbNukeguardSettings> {
    return data;
}
