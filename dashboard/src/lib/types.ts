import type { FEMessageData, TFChannel, TFRole } from "shared";

export type FEData = {
    guild: string;
    roles: TFRole[];
    channels: TFChannel[];
};

export type FESettings = {
    dashboardPermissions: "owner" | "admin" | "manager";
    embedColor: string;
    muteRole: string | null;
    banFooter: string;
    modOnly: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    allowlistOnly: boolean;
    allowedChannels: string[];
    blockedChannels: string[];
};

export type FEModulesPermissionsSettings = {
    modules: Record<string, { enabled: boolean }>;
    commands: Record<
        string,
        {
            enabled: boolean;
            ignoreDefaultPermissions: boolean;
            allowedRoles: string[];
            blockedRoles: string[];
            restrictChannels: boolean;
            allowedChannels: string[];
            blockedChannels: string[];
        }
    >;
};

export type FEWelcomeSettings = {
    channel: string | null;
    message: FEMessageData;
};

export type FELoggingSettings = {
    useWebhook: boolean;
    defaultChannel: string | null;
    defaultWebhook: string;
    ignoredChannels: string[];
    filesOnly: boolean;
    categories: Record<
        string,
        {
            enabled: boolean;
            useWebhook: boolean;
            outputChannel: string | null;
            outputWebhook: string;
            events: Record<
                string,
                {
                    enabled: boolean;
                    useWebhook: boolean;
                    outputChannel: string | null;
                    outputWebhook: string;
                }
            >;
        }
    >;
};

export type FESupporterAnnouncementsSettings = {
    entries: {
        channel: string | null;
        boosts: boolean;
        role: string | null;
        message: FEMessageData;
    }[];
};
