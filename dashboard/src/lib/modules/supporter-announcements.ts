import type { FEData, FESupporterAnnouncementsSettings } from "$lib/types.js";
import type { DbSupporterAnnouncementsSettings } from "shared";
import { b2fMessage, f2bMessage } from "./utils.js";

export async function b2fSupporterAnnouncementsSettings(
    fe: FEData,
    data: Partial<DbSupporterAnnouncementsSettings> | null,
): Promise<FESupporterAnnouncementsSettings> {
    return {
        entries: (data?.entries ?? []).map((x) => ({
            ...x,
            message: b2fMessage(x.message),
        })),
    };
}

export async function f2bSupporterAnnouncementsSettings(data: FESupporterAnnouncementsSettings): Promise<DbSupporterAnnouncementsSettings> {
    return { entries: data.entries.map((x) => ({ ...x, message: f2bMessage(x.message) })) };
}
