import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, params: { id } }) => {
    if (locals.unauthorized) return;

    const keys = (await db.premiumKeyBindings.find({ guild: id }).toArray()).map((x) => x.key);
    const settings = { ...((await db.guilds.findOne({ guild: id })) ?? {}), _id: undefined };
    delete settings.token;

    return { keys, settings };
};
