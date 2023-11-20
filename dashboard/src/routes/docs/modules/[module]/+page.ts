import { error } from "@sveltejs/kit";
import { modules } from "shared";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ params: { module: mid } }) => {
    const module = modules[mid];
    if (!module) throw error(404, "Module Not Found");

    return { module };
};
