import { API, DISCORD_API } from "$env/static/private";
import type { RequestHandler } from "@sveltejs/kit";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guilds: any[] = response;

    const g_request = await fetch(`${API}/check-guilds`, {
        method: "post",
        body: JSON.stringify({ guilds, user: user.id }),
        headers: { "Content-Type": "application/json" },
    });

    if (!g_request.ok) return new Response(JSON.stringify({ error: "Failed to obtain internal data." }));

    const g_response = await g_request.json();

    return new Response(
        JSON.stringify({
            guilds: g_response
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => priority(a) - priority(b)),
        }),
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function priority(guild: any): number {
    return (BigInt(guild.permissions) & BigInt(8) ? 0 : 1) + (guild.has_bot ? 0 : 2);
}
