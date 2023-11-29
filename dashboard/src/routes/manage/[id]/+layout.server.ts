import { API } from "$env/static/private";
import { redirect } from "@sveltejs/kit";
import type { TFChannel, TFEmoji, TFRole, TFSound, TFSticker } from "shared";
import { getPremiumBenefitsFor, isModuleEnabled } from "shared/db.js";
import type { LayoutServerLoad } from "./$types.js";
import collections from "./collections.js";
import { b2f } from "./modules.js";

export const load: LayoutServerLoad = async ({ fetch, locals, params, url }) => {
    if (!params.id.match(/^[1-9][0-9]{16,19}$/)) throw redirect(303, "/manage");
    if (!locals.user) throw redirect(303, `/auth/login?${new URLSearchParams({ redirect: url.pathname })}`);

    const request = await fetch(`${API}/check-guild`, {
        method: "POST",
        body: JSON.stringify({ user: locals.user.id, guild: params.id }),
        headers: { "Content-Type": "application/json" },
    });

    const response: {
        name: string;
        owner: boolean;
        valid: boolean;
        roles: TFRole[];
        channels: TFChannel[];
        emojis: TFEmoji[];
        stickers: TFSticker[];
        sounds: TFSound[];
    } = await request.json();

    if (!response.valid) throw redirect(303, "/manage?reload");

    locals.authorized = true;

    const key = url.pathname.split("/")[3] ?? "-";

    const fe = { guild: params.id, ...response };

    const roots: TFChannel[] = [];
    const map = Object.fromEntries(response.channels.map((ch) => [ch.id, ch]));

    for (const channel of response.channels)
        if (!channel.parent) roots.push(channel);
        else (map[channel.parent].children ??= []).push(channel);

    function sortChannels(list: TFChannel[]) {
        list.sort((x, y) => (x.type === 2 || x.type === 13 ? 1 : 0) - (y.type === 2 || y.type === 13 ? 1 : 0) || x.position - y.position);
        for (const { children } of list) if (children) sortChannels(children);
    }

    sortChannels(roots);
    roots.sort((x, y) => (x.type === 4 ? 1 : 0) - (y.type === 4 ? 1 : 0));

    if (key in collections() || key === "debug")
        return {
            guildName: response.name,
            owner: response.owner,
            roles: response.roles,
            channels: response.channels,
            emojis: response.emojis,
            stickers: response.stickers,
            sounds: response.sounds,
            rootChannels: roots,
            enabled: await isModuleEnabled(params.id, key),
            premium: await getPremiumBenefitsFor(params.id),
            data:
                key === "debug"
                    ? null
                    : await b2f[key as keyof typeof b2f](
                          fe,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (await collections()[key as keyof ReturnType<typeof collections>].findOne({ guild: params.id })) as any,
                      ),
        };

    return { guildName: response.name, owner: response.owner, missing: true };
};
