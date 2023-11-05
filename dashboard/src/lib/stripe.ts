import { PRICE_T1_M, PRICE_T1_Y, PRICE_T2_M, PRICE_T2_Y, STRIPE_KEY } from "$env/static/private";
import { PUBLIC_DOMAIN } from "$env/static/public";
import { db } from "shared/db.js";
import Stripe from "stripe";

export const stripe = new Stripe(STRIPE_KEY);

export async function getPortalSessions(id: string, getUrls: boolean = true) {
    const entries = await db.customers.find({ discord: id }).toArray();

    const customers = await Promise.all(entries.map(async (entry) => await stripe.customers.retrieve(entry.stripe, { expand: ["subscriptions"] })));

    return (
        await Promise.all(
            customers.map(async (customer) => {
                if (customer.deleted) return null;

                return {
                    subscriptions: (customer.subscriptions?.data ?? []).flatMap((sub) =>
                        sub.items.data.map((item) => ({
                            created: sub.created,
                            product:
                                {
                                    [PRICE_T1_M]: "Basic Premium (Monthly)",
                                    [PRICE_T1_Y]: "Basic Premium (Annual)",
                                    [PRICE_T2_M]: "Ultimate Premium (Monthly)",
                                    [PRICE_T2_Y]: "Ultimate Premium (Annual)",
                                }[item.price.id] ?? "Unknown Product",
                            level:
                                { [PRICE_T1_M]: "basic", [PRICE_T1_Y]: "basic", [PRICE_T2_M]: "ultimate", [PRICE_T2_Y]: "ultimate" }[item.price.id] ??
                                "unknown",
                            quantity: item.quantity ?? 1,
                        })),
                    ),
                    url: getUrls
                        ? (await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: `${PUBLIC_DOMAIN}/account/premium` })).url
                        : "",
                };
            }),
        )
    ).filter((x) => x);
}

export async function getPaymentLinks(id: string) {
    const key = `${id}.${PRICE_T1_M}.${PRICE_T1_Y}.${PRICE_T2_M}.${PRICE_T2_Y}`;

    const entry = await db.paymentLinks.findOne({ key });
    if (entry) return entry.links;

    const links = (await Promise.all(
        [PRICE_T1_M, PRICE_T1_Y, PRICE_T2_M, PRICE_T2_Y].map(
            async (price) =>
                (
                    await stripe.paymentLinks.create({
                        line_items: [{ price, quantity: 1, adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 } }],
                        metadata: { id },
                        after_completion: { type: "redirect", redirect: { url: `${PUBLIC_DOMAIN}/stripe/callback` } },
                    })
                ).url,
        ),
    )) as [string, string, string, string];

    await db.paymentLinks.updateOne({ key }, { $set: { links } }, { upsert: true });
    return links;
}
