import { API } from "$env/static/private";
import { redirect } from "@sveltejs/kit";
import collections from "../../collections.js";
import type { RequestHandler } from "./$types.js";
import schemas from "./schemas.js";

export const POST: RequestHandler = async ({ fetch, locals, params: { id, module }, request }) => {
    const req = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: id }),
        headers: { "Content-Type": "application/json" },
    });

    const res: { valid: boolean } = await req.json();
    if (!res.valid) throw redirect(303, "/manage?reload");

    try {
        if (!(module in schemas)) throw "Missing schema (this is our fault).";
        if (!(module in collections())) throw "Missing database collection (this is our fault).";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;

        try {
            data = schemas[module as keyof typeof schemas].parse(await request.json());
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw error.errors.map(({ message }: { message: string }) => message).join(" ");
        }

        await collections()[module as keyof ReturnType<typeof collections>].updateOne({ guild: id }, { $set: data }, { upsert: true });

        return new Response();
    } catch (error) {
        return new Response(`${error}`, { status: 400 });
    }
};
