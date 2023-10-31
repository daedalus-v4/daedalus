import { sortRoles } from "$lib/utils.js";
import type { DbSettings } from "shared";
import type { FEData, FESettings } from "../types.js";
import { defaults } from "./utils.js";

export async function b2fGuildSettings(fe: FEData, data: Partial<DbSettings> | null): Promise<FESettings> {
    if (data?.allowedRoles) sortRoles(data.allowedRoles, fe.roles);
    if (data?.blockedRoles) sortRoles(data.blockedRoles, fe.roles);

    return defaults<FESettings>(
        { ...data, embedColor: data?.embedColor === undefined ? undefined : `#${data.embedColor.toString(16).padStart(6, "0")}` },
        {
            dashboardPermissions: "manager",
            embedColor: "#009688",
            muteRole: null,
            banFooter: "",
            modOnly: false,
            allowedRoles: [],
            blockedRoles: [],
            allowlistOnly: false,
            allowedChannels: [],
            blockedChannels: [],
        },
    );
}

export async function f2bGuildSettings(data: FESettings): Promise<DbSettings> {
    if (!data.embedColor.match(/^#[0-9a-f]{6}$/i)) throw "Invalid format for embed color: expected # followed by 6 hexadecimal digits.";
    return { ...data, embedColor: parseInt(data.embedColor.slice(1), 16) };
}

export function diffGuildSettings(x: FESettings, y: FESettings): boolean {
    return JSON.stringify(x) !== JSON.stringify(y);
}
