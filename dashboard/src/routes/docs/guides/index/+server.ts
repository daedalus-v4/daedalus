import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async () => {
    throw redirect(308, "/docs/guides");
};
