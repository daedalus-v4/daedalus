import recalculate from "$lib/recalculate-premium.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const key = url.searchParams.get("key") ?? "";

    const result = await db.premiumKeys.updateOne({ user: locals.user.id }, { $pull: { keys: key } });
    if (result.modifiedCount > 0) await db.premiumKeyBindings.deleteOne({ key });

    await recalculate(locals.user.id);

    return new Response();
};
