import { API } from "$env/static/private";
import getClient from "$lib/get-client.js";
import { error, redirect } from "@sveltejs/kit";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ fetch, locals: { user }, params: { uuid }, url }) => {
    if (!user) throw redirect(303, `/auth/login?${new URLSearchParams({ redirect: url.pathname })}`);

    const ticket = await db.tickets.findOne({ uuid });
    if (!ticket) throw error(404, "Ticket Not Found");

    const settings = await db.ticketsSettings.findOne({ guild: ticket.guild });
    const { owner, roles }: { owner: boolean; roles: string[] } = await (await fetch(`${API}/roles/${ticket.guild}/${user.id}`)).json();

    if (
        !owner &&
        !settings?.prompts
            .find((x) => x.id === ticket.prompt)
            ?.targets.find((x) => x.id === ticket.target)
            ?.accessRoles.some((x) => roles.includes(x))
    )
        throw error(403, "Access Forbidden");

    const ids = [
        ...new Set(
            ticket.messages
                .map((x) => ("author" in x ? x.author : null))
                .filter((x) => x)
                .concat(ticket.user),
        ),
    ] as string[];

    const tags: Record<string, string> = await (await fetch(`${API}/prefetch-tags/${ids.join(":")}`)).json();
    const needed = ids.filter((x) => !(x in tags));

    return {
        ticket: { ...ticket, _id: undefined },
        guildName: (await (await getClient(ticket.guild).catch(() => null))?.guilds.fetch(ticket.guild))?.name,
        tags,
        streamed: { tags: (async () => (needed.length === 0 ? {} : await (await fetch(`${API}/tags/${needed.join(":")}`)).json()))() },
    };
};
