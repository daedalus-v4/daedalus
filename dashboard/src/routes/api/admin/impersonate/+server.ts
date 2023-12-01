import getClient from "$lib/get-client.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals: { user, realUser, admin }, url }) => {
    if (!user || !admin) return new Response("You must be signed in as an admin.", { status: 403 });

    const id = url.searchParams.get("id");

    if (!id) {
        await db.impersonations.deleteOne({ admin: (realUser ?? user).id });
    } else {
        const target = await (await getClient()).users.fetch(id).catch(() => {});
        if (!target) return new Response("That user does not exist.", { status: 404 });

        await db.impersonations.updateOne({ admin: user.id }, { $set: { target: id } }, { upsert: true });
    }

    return new Response();
};
