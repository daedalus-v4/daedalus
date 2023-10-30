import { API } from "$env/static/private";
import type { PageServerLoad } from "./$types.js";

interface IData {
    guildCount: number;
}

export const load: PageServerLoad<IData> = async ({ fetch }) => {
    try {
        return { guildCount: await (await fetch(`${API}/guild-count`)).json() };
    } catch {
        return { guildCount: -1 };
    }
};
