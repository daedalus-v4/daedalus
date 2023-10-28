import { PermissionResolvable } from "discord.js";

export type ModuleData = Record<
    string,
    {
        name: string;
        icon?: string;
        description?: string;
        commands?: Record<
            string,
            {
                name: string;
                icon?: string;
                description?: string;
                ghost: boolean;
                bypass: boolean;
                admin: boolean;
                permissions?: PermissionResolvable;
                selfPermissions?: PermissionResolvable;
                default: boolean;
            }
        >;
        selfPermissions?: PermissionResolvable;
        default: boolean;
    }
>;
