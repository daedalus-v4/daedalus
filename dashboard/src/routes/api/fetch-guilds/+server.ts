import { API, DISCORD_API } from "$env/static/private";
import type { RequestHandler } from "@sveltejs/kit";
import type { DDLGuild } from "shared";

export const GET: RequestHandler = async ({ cookies, fetch, locals }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user } = locals as any;

    const access_token = cookies.get("discord_access_token");
    if (!access_token) return new Response('{"error":"Missing access token in request."}');

    const request = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    const response = await request.json();

    if (!request.ok) return new Response(JSON.stringify({ error: "Failed to fetch your servers.", data: response }));

    const guilds: DDLGuild[] = response.map((x: DDLGuild) => ({
        id: x.id,
        name: x.name,
        icon: x.icon,
        owner: x.owner,
        permissions: x.permissions,
        hasBot: x.hasBot,
        features: x.features.filter((x: string) => ["COMMUNITY"].includes(x)),
        notIn: x.notIn,
    }));

    const g_request = await fetch(`${API}/check-guilds`, {
        method: "post",
        body: JSON.stringify({ guilds, user: user.id }),
        headers: { "Content-Type": "application/json" },
    });

    if (!g_request.ok) return new Response(JSON.stringify({ error: "Failed to obtain internal data." }));

    const g_response = await g_request.json();

    return new Response(JSON.stringify({ guilds: g_response }));
};
