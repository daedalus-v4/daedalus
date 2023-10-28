import { DISCORD_API, DISCORD_SECRET } from "$env/static/private";
import { PUBLIC_DISCORD_ID } from "$env/static/public";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, fetch }) => {
    const refresh_token = url.searchParams.get("code");
    if (!refresh_token) return new Response('{"error":"No refresh token found."}', { status: 500 });

    const data = {
        client_id: PUBLIC_DISCORD_ID,
        client_secret: DISCORD_SECRET,
        grant_type: "refresh_token",
        refresh_token,
    };

    const request = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "post",
        body: new URLSearchParams(data),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!request.ok)
        return new Response(JSON.stringify({ error: "Failed to refresh", data: await request.json() }), {
            status: 500,
        });

    const response = await request.json();

    return new Response(
        JSON.stringify({
            discord_access_token: response.access_token,
            discord_refresh_token: response.refresh_token,
            access_token_exp: Date.now() + response.expires_in,
            refresh_token_exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }),
    );
};
