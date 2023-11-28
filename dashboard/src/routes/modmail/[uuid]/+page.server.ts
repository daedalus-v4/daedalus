import { API } from "$env/static/private";
import getClient from "$lib/get-client.js";
import { error, redirect } from "@sveltejs/kit";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ fetch, locals: { user }, params: { uuid }, url }) => {
    if (!user) throw redirect(303, `/auth/login?${new URLSearchParams({ redirect: url.pathname })}`);

    const thread = await db.modmailThreads.findOne({ uuid });
    if (!thread) throw error(404, "Modmail Thread Not Found");

    const settings = await db.modmailSettings.findOne({ guild: thread.guild });
    const { owner, roles }: { owner: boolean; roles: string[] } = await (await fetch(`${API}/roles/${thread.guild}/${user.id}`)).json();

    if (!owner && !settings?.targets.find((x) => x.id === thread.id)?.accessRoles.some((x) => roles.includes(x))) throw error(403, "Access Forbidden");

    const ids = [
        ...new Set(
            thread.messages
                .map((x) => ("author" in x ? x.author : null))
                .filter((x) => x)
                .concat(thread.user),
        ),
    ] as string[];

    const tags: Record<string, string> = await (await fetch(`${API}/prefetch-tags/${ids.join(":")}`)).json();
    const needed = ids.filter((x) => !(x in tags));

    return {
        thread: { ...thread, _id: undefined },
        guildName: (await (await (await getClient(thread.guild).catch(() => {}))?.guilds.fetch(thread.guild).catch(() => {}))?.fetch().catch(() => {}))?.name,
        tags,
        streamed: { tags: (async () => (needed.length === 0 ? {} : await (await fetch(`${API}/tags/${needed.join(":")}`)).json()))() },
    };
};
