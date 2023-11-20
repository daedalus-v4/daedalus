import { API } from "$env/static/private";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, request, url }) => {
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

    const token = await request.text();

    {
        const req = await fetch(`${API}/assign-client`, {
            method: "POST",
            body: JSON.stringify({ guild, token }),
            headers: { "Content-Type": "application/json" },
        });

        const res: string | null = await req.json();

        if (!res)
            return new Response(
                "Setting your guild's client failed. Please ensure you have followed all necessary steps and invited the bot to the server first. Also ensure that this client is not in use elsewhere. If you have double-checked the instructions and you are still getting this error, please contact support.",
                { status: 400 },
            );

        return new Response(res);
    }
};
