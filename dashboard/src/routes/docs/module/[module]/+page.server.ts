import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ params: { module } }) => {
    throw redirect(308, `/docs/modules/${module}`);
};
