import recalculate from "$lib/recalculate-premium.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();

    const checkout = data.type === "checkout.session.completed";

    if (checkout) await db.customers.insertOne({ discord: data.data.object.metadata.id, stripe: data.data.object.customer });

    if (checkout || data.type.startsWith("customer.subscription.")) {
        const entry = await db.customers.findOne({ stripe: data.data.object.customer });
        if (!entry) return new Response();

        await recalculate(entry.discord);
    }

    return new Response();
};
