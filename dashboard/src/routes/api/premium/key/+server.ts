import { getPortalSessions } from "$lib/stripe.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const level = url.searchParams.get("level") ?? "";
    if (!["basic", "ultimate"].includes(level)) return new Response("Invalid premium level provided.", { status: 400 });

    const prefix = { basic: "bpk_", ultimate: "upk_" }[level] ?? "\0";

    const sessions = await getPortalSessions(locals.user.id);
    const keys = (await db.premiumKeys.findOne({ id: locals.user.id }))?.keys ?? [];

    const available =
        sessions.flatMap((session) => session!.subscriptions.filter((sub) => sub.level === level).map((sub) => sub.quantity)).reduce((x, y) => x + y) -
        keys.filter((key) => key.startsWith(prefix)).length;

    if (available <= 0) return new Response("You do not have any subscriptions left.", { status: 402 });

    let key: string;

    do {
        key = `${prefix}${new Array(16)
            .fill(0)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join("")}`;
    } while (keys.includes(key));

    await db.premiumKeys.updateOne({ user: locals.user.id }, { $push: { keys: key } }, { upsert: true });

    return new Response();
};
