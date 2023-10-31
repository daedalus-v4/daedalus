export type FESettings = {
    guild: string;
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
