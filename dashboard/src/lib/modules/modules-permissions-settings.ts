import { modules, type DbModulesPermissionsSettings } from "shared";
import type { FEData, FEModulesPermissionsSettings } from "../types.js";
import { defaults } from "./utils.js";

export async function b2fModulesPermissionsSettings(fe: FEData, data: Partial<DbModulesPermissionsSettings> | null): Promise<FEModulesPermissionsSettings> {
    return {
        modules: defaults<FEModulesPermissionsSettings["modules"]>(
            data?.modules,
            Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, { enabled: v.default ?? true }])),
        ),
        commands: defaults<FEModulesPermissionsSettings["commands"]>(
            data?.commands,
            Object.fromEntries(
                Object.values(modules)
                    .flatMap((m) => Object.entries(m.commands ?? {}))
                    .map(([k, v]) => [
                        k,
                        {
                            enabled: v.default ?? true,
                            ignoreDefaultPermissions: false,
                            allowedRoles: [],
                            blockedRoles: [],
                            restrictChannels: false,
                            allowedChannels: [],
                            blockedChannels: [],
                        },
                    ]),
            ),
        ),
    };
}

export async function f2bModulesPermissionsSettings(data: FEModulesPermissionsSettings): Promise<DbModulesPermissionsSettings> {
    return data;
}
