import { API } from "$env/static/private";
import recalculate from "$lib/recalculate-premium.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const key = url.searchParams.get("key") ?? "";
    const guild = url.searchParams.get("guild") ?? "";

    const userDoc = await db.premiumKeys.findOne({ keys: key });
    if (!userDoc) return new Response("That key does not exist.", { status: 400 });
    if ((await db.premiumKeyBindings.countDocuments({ key })) > 0) return new Response("That key is already in use.", { status: 400 });

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: guild }),
        headers: { "Content-Type": "application/json" },
    });

    const response: { valid: boolean } = await request.json();
    if (!response.valid) return new Response("You do not have permission to manage this server.", { status: 403 });

    const doc = await db.premiumKeyBindings.findOneAndUpdate({ key }, { $setOnInsert: { guild } }, { upsert: true });
    if (doc) return new Response("That key is already in use.", { status: 400 });

    await recalculate(userDoc.user, guild);

    return new Response();
};
