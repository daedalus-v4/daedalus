import { API } from "$env/static/private";
import { b2fGuildSettings } from "$lib/modules.js";
import { redirect } from "@sveltejs/kit";
import type { TFChannel, TFRole } from "shared";
import { db } from "shared/db.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals, params, url }) => {
    if (!params.id.match(/^[1-9][0-9]{16,19}$/)) throw redirect(303, "/manage");
    if (!locals.user) throw redirect(303, `/auth/login?${new URLSearchParams({ redirect: url.pathname })}`);

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: params.id }),
        headers: { "Content-Type": "application/json" },
    });

    const response: { valid: boolean; roles: TFRole[]; channels: TFChannel[] } = await request.json();

    if (!response) throw redirect(303, "/manage?reload");

    let key = url.pathname.split("/").at(-1) ?? "-";
    if (key.match(/^\d+$/)) key = "-";

    if (key === "-")
        return {
            roles: response.roles,
            channels: response.channels,
            data: await b2fGuildSettings(params.id, await db.guildSettings.findOne({ guild: params.id })),
        };
};
