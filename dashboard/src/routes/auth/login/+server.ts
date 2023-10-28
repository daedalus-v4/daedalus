import { DISCORD_API, DISCORD_CALLBACK } from "$env/static/private";
import { PUBLIC_DISCORD_ID } from "$env/static/public";
import type { RequestHandler } from "./$types.js";

const DISCORD_ENDPOINT = (path: string, state: string) =>
    `${DISCORD_API}/oauth2/authorize?${new URLSearchParams({
        client_id: PUBLIC_DISCORD_ID,
        redirect_url: DISCORD_CALLBACK,
        response_type: "code",
        scope: "identify guilds",
        state: state + path,
    })}`;

export const GET: RequestHandler = ({ cookies, url }) => {
    const state = String.fromCharCode(...new Array(32).fill(0).map(() => Math.floor(Math.random() * 94) + 33));

    const headers = new Headers({ Location: DISCORD_ENDPOINT(url.searchParams.get("redirect") ?? "/", state) });

    headers.append(
        "Set-Cookie",
        cookies.serialize("state", state, { path: "/", httpOnly: true, sameSite: "lax", expires: new Date(Date.now() + 10 * 60 * 1000) }),
    );

    return new Response(null, { headers, status: 303 });
};
