import { API } from "$env/static/private";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, params: { id } }) => {
    if (!locals.user) return;

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: id }),
        headers: { "Content-Type": "application/json" },
    });

    const response: { valid: boolean } = await request.json();
    if (!response.valid) return;

    const keys = (await db.premiumKeyBindings.find({ guild: id }).toArray()).map((x) => x.key);
    const settings = { ...((await db.guilds.findOne({ guild: id })) ?? {}), _id: undefined, hasCustomClient: false };

    if (settings.token) {
        delete settings.token;
        settings.hasCustomClient = true;
    }

    return { keys, settings };
};
