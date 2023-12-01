import { stripe } from "$lib/stripe.js";
import { db } from "shared/db.js";
import type { Actions } from "./$types.js";

export const actions: Actions = {
    async default({ request }) {
        const data = await request.formData();

        const action = data.get("submit");

        const customer = (data.get("stripe") ?? "") as string;
        const discord = (data.get("discord") ?? "") as string;

        const response = await (async () => {
            if (action === "Fetch Discord User from Customer ID") {
                const entry = await db.customers.findOne({ stripe: customer });

                if (entry) return { og: customer, discord: entry.discord };

                const result = await stripe.customers.retrieve(customer).catch(() => {});
                if (!result) return { error: "This customer ID does not exist." };

                return { error: "This customer ID is not assigned to a user." };
            } else if (action === "Fetch Customer IDs from Discord User") {
                const entries = await db.customers.find({ discord }).toArray();

                return { og: discord, customers: entries.map((x) => x.stripe) };
            } else if (action === "Add Association") {
                const entry = await db.customers.findOne({ stripe: customer });
                if (entry) return { error: `That customer is already bound to <code class="code">${entry.discord}</code>.` };

                await db.customers.updateOne({ stripe: customer }, { $set: { discord } }, { upsert: true });
                return { added: { customer, discord } };
            } else if (action === "Remove Association") {
                const entry = await db.customers.findOneAndDelete({ discord, stripe: customer });
                if (!entry) return { error: "That association does not exist." };

                return { removed: { customer, discord } };
            }

            return { error: "NotImplemented" };
        })();

        return { original: { customer, discord }, ...response };
    },
};
