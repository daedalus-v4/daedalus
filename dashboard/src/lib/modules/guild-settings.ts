import type { DbSettings } from "shared";
import type { FESettings } from "../types.js";

export async function b2fGuildSettings(guild: string, data: DbSettings | null): Promise<FESettings> {
    return data
        ? { ...data, embedColor: `#${data.embedColor.toString(16).padStart(6, "0")}` }
        : {
              guild,
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
          };
}

export async function f2bGuildSettings(data: FESettings): Promise<DbSettings> {
    if (!data.embedColor.match(/^#\d{6}$/)) throw "Invalid format for embed color: expected # followed by 6 hexadecimal digits.";
    return { ...data, embedColor: parseInt(data.embedColor.slice(1), 16) };
}

export function diffGuildSettings(x: FESettings, y: FESettings): boolean {
    return JSON.stringify(x) !== JSON.stringify(y);
}
