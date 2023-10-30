import { API } from "$env/static/private";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals, params, url }) => {
    if (!params.id.match(/^[1-9][0-9]{16,19}$/)) throw redirect(303, "/manage");
    if (!locals.user) throw redirect(303, `/auth/login?${new URLSearchParams({ redirect: url.pathname })}`);

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: params.id }),
        headers: { "Content-Type": "application/json" },
    });

    const response = await request.json();

    if (!response) throw redirect(303, "/manage?reload");
};
