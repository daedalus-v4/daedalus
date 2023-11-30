import { API } from "$env/static/private";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals: { user } }) => {
    if (!user?.admin) return {};

    return {
        guildCount: (await (await fetch(`${API}/guild-count`).catch(() => {}))?.json()) ?? -1,
        premiumUsers: (await db.premiumKeys.distinct("user")).length,
    };
};
