import { DISCORD_API } from "$env/static/private";
import { PUBLIC_DOMAIN } from "$env/static/public";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    console.log(`[${event.request.method}] ${event.url.pathname}`);
    if (event.url.pathname.startsWith("/auth/")) return await resolve(event);

    const { cookies } = event;
    let token: string | undefined;

    if ((token = cookies.get("discord_refresh_token")) && !cookies.get("discord_access_token")) {
        const request = await fetch(`${PUBLIC_DOMAIN}/auth/refresh?${new URLSearchParams({ code: token })}`);
        const response = await request.json();

        if (response.discord_access_token) {
            event.cookies.set("discord_access_token", response.discord_access_token, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                expires: new Date(response.access_token_exp),
            });

            event.cookies.set("discord_refresh_token", response.discord_refresh_token, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                expires: new Date(response.refresh_token_exp),
            });

            const userRequest = await fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${response.discord_access_token}` } });
            const userResponse = await userRequest.json();

            if (userResponse.id) event.locals.user = userResponse;
        }
    }

    if ((token = cookies.get("discord_access_token"))) {
        const request = await fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${token}` } });
        const response = await request.json();

        if (response.id) {
            event.locals.user = response;
        }
    }

    return await resolve(event);
};
