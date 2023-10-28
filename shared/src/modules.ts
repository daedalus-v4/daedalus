import TOML from "@iarna/toml";
import { PermissionFlagsBits } from "discord.js";
import { readFileSync } from "fs";
import path from "path";
import { ModuleData } from "./types.js";

const data = TOML.parse(readFileSync(path.join(__dirname, "modules.toml"), "utf-8")) as Record<
    string,
    {
        name: string;
        icon?: string;
        description?: string;
        commands: Record<
            string,
            {
                name: string;
                icon?: string;
                description?: string;
                ghost?: boolean;
                bypass?: boolean;
                admin?: boolean;
                permissions?: string[];
                selfPermissions?: string[];
                default?: boolean;
            }
        >;
        selfPermissions?: string[];
        default?: boolean;
    }
>;

function getPermissions(array: string[]) {
    return array.map((x) => PermissionFlagsBits[x as keyof typeof PermissionFlagsBits]).reduce((x, y) => x | y, 0n);
}

export const modules: ModuleData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
        k,
        {
            name: v.name,
            icon: v.icon,
            description: v.description,
            commands: Object.fromEntries(
                Object.entries(v.commands ?? {}).map(([k, v]) => [
                    k,
                    {
                        name: v.name,
                        icon: v.icon,
                        description: v.description,
                        ghost: v.ghost ?? false,
                        bypass: v.bypass ?? false,
                        admin: v.admin ?? false,
                        permissions: getPermissions(v.permissions ?? []),
                        selfPermissions: getPermissions(v.selfPermissions ?? []),
                        default: v.default ?? true,
                    },
                ]),
            ),
            selfPermissions: getPermissions(v.selfPermissions ?? []),
            default: v.default ?? true,
        },
    ]),
);
