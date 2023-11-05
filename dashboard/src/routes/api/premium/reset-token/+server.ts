import { API } from "$env/static/private";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const guild = url.searchParams.get("guild") ?? "";

    {
        const req = await fetch(`${API}/check-guild`, {
            method: "POST",
            body: JSON.stringify({ user: locals.user.id, guild }),
            headers: { "Content-Type": "application/json" },
        });

        const res: { valid: boolean } = await req.json();
        if (!res.valid) return new Response("You do not have permission to manage this server.", { status: 403 });
    }

    {
        const req = await fetch(`${API}/reset-client`, { method: "POST", body: JSON.stringify({ guild }), headers: { "Content-Type": "application/json" } });
        const res: boolean = await req.json();

        if (!res) return new Response("Resetting your guild's client failed. If this issue persists, please contact support.");
        return new Response();
    }
};
