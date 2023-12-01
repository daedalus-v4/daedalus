import { DB_NAME, DB_URI, DISCORD_API, OWNER } from "$env/static/private";
import { PUBLIC_DOMAIN } from "$env/static/public";
import getClient from "$lib/get-client.js";
import recalculate from "$lib/recalculate-premium.js";
import type { Handle } from "@sveltejs/kit";
import { connect, db } from "shared/db.js";

let connected = false;

export const handle: Handle = async ({ event, resolve }) => {
    if (!connected) {
        await connect(DB_URI, DB_NAME);
        recalculate();
        setInterval(recalculate, 24 * 60 * 60 * 1000);
        connected = true;
    }

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

        if (response.id) event.locals.user = response;
    }

    if (event.locals.user) {
        event.locals.owner = event.locals.user.owner = event.locals.user.id === OWNER;
        event.locals.admin = event.locals.user.admin = event.locals.user.owner || (await db.admins.countDocuments({ id: event.locals.user.id })) > 0;

        if (event.locals.admin) {
            const entry = await db.impersonations.findOne({ admin: event.locals.user.id });

            if (entry && (await db.admins.countDocuments({ user: entry.target })) === 0 && entry.target !== OWNER) {
                try {
                    const client = await getClient();
                    const user = await client.users.fetch(entry.target);

                    event.locals.realUser = event.locals.user;

                    event.locals.user = {
                        id: user.id,
                        username: user.username,
                        global_name: user.globalName!,
                        discriminator: user.discriminator,
                        avatar: user.avatar!,
                        owner: false,
                        admin: false,
                    };
                } catch {
                    // do nothing
                }
            }
        }
    } else {
        event.locals.owner = event.locals.admin = false;
    }

    return await resolve(event);
};
