import { API } from "$env/static/private";
import type { DbNukeguardSettings } from "shared";
import { db } from "shared/db.js";

export default async function (settings: DbNukeguardSettings, currentGuild: string, user: { id: string }): Promise<DbNukeguardSettings> {
    const { owner, roles }: { owner: boolean; roles: string[] } = await (await fetch(`${API}/roles/${currentGuild}/${user.id}`)).json();
    if (owner) return settings;

    const old = await db.nukeguardSettings.findOne({ guild: currentGuild });
    if (!old?.exemptedRoles.some((x) => roles.includes(x))) throw "You do not have permission to edit the nukeguard configuration for this server.";

    return settings;
}
