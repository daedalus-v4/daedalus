import { redirect } from "@sveltejs/kit";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ params: { gid, id } }) => {
    const doc = await db.modmailThreads.findOne({ guild: gid, user: id });
    if (!doc) throw redirect(308, "/");

    throw redirect(308, `/modmail/${doc.uuid}`);
};
