import { API } from "$env/static/private";
import recalculate from "$lib/recalculate-premium.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const key = url.searchParams.get("key") ?? "";

    const userDoc = await db.premiumKeys.findOne({ keys: key });
    if (!userDoc) return new Response("That key does not exist.", { status: 400 });

    const doc = await db.premiumKeyBindings.findOne({ key });
    if (!doc) return new Response("That key is not in use.", { status: 400 });

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: doc.guild }),
        headers: { "Content-Type": "application/json" },
    });

    const response: { valid: boolean } = await request.json();
    if (!response.valid) return new Response("You do not have permission to manage this server.", { status: 403 });

    await db.premiumKeyBindings.deleteOne({ _id: doc._id });

    await recalculate(userDoc.user);

    return new Response();
};
