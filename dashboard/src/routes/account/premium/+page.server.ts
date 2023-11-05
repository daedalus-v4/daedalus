import { getPaymentLinks, getPortalSessions } from "$lib/stripe.js";
import { db } from "shared/db.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) return;

    const keys = (await db.premiumKeys.findOne({ user: locals.user.id }))?.keys ?? [];

    return {
        sessions: await getPortalSessions(locals.user.id),
        links: await getPaymentLinks(locals.user.id),
        keys,
        activations: Object.fromEntries((await db.premiumKeyBindings.find({ key: { $in: keys } }).toArray()).map((bind) => [bind.key, bind.guild])),
    };
};
