import { DISCORD_API, DISCORD_CALLBACK, DISCORD_SECRET } from "$env/static/private";
import { PUBLIC_DISCORD_ID } from "$env/static/public";
import type { RequestHandler } from "@sveltejs/kit";

const fail = (path = "/") => new Response(null, { headers: { Location: path }, status: 302 });

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
    const code = url.searchParams.get("code");
    if (!code) return fail();

    const state = url.searchParams.get("state");
    if (!state || state?.substring(0, 32) !== cookies.get("state")) return fail("/?state-mismatch");

    const data = {
        client_id: PUBLIC_DISCORD_ID,
        client_secret: DISCORD_SECRET,
        grant_type: "authorization_code",
        redirect_uri: DISCORD_CALLBACK,
        code,
        scope: "identify guilds",
    };

    const request = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "post",
        body: new URLSearchParams(data),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!request.ok) return fail();
    const response = await request.json();

    const access_token_exp = new Date(Date.now() + response.expires_in);
    const refresh_token_exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const headers = new Headers({ Location: state.substring(32) });

    headers.append(
        "Set-Cookie",
        cookies.serialize("discord_access_token", response.access_token, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            expires: access_token_exp,
        }),
    );

    headers.append(
        "Set-Cookie",
        cookies.serialize("discord_refresh_token", response.refresh_token, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            expires: refresh_token_exp,
        }),
    );

    return new Response(null, { headers, status: 303 });
};
