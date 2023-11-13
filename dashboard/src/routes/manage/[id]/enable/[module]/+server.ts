import { API } from "$env/static/private";
import { redirect } from "@sveltejs/kit";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const PUT: RequestHandler = async ({ fetch, locals, params: { id, module } }) => {
    const req = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: id }),
        headers: { "Content-Type": "application/json" },
    });

    const res: { valid: boolean } = await req.json();

    if (!res.valid) throw redirect(303, "/manage?reload");

    await db.modulesPermissionsSettings.updateOne({ guild: id }, { $set: { [`modules.${module}.enabled`]: true } }, { upsert: true });
    return new Response("", { status: 200 });
};
