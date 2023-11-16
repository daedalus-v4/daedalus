import { API } from "$env/static/private";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ fetch, locals: { user }, params: { id } }) => {
    if (!user) return;

    const { owner, roles }: { owner: boolean; roles: string[] } = await (await fetch(`${API}/roles/${id}/${user.id}`)).json();
    if (owner) return { access: true };

    const settings = await db.nukeguardSettings.findOne({ guild: id });
    return { access: settings?.exemptedRoles.some((x) => roles.includes(x)) };
};
