import { stripe } from "$lib/stripe.js";
import { db } from "shared/db.js";
import type { Actions } from "./$types.js";

export const actions: Actions = {
    async default({ request }) {
        const data = await request.formData();

        const action = data.get("submit");

        const customer = (data.get("stripe") ?? "") as string;
        const discord = (data.get("discord") ?? "") as string;

        if (action === "Fetch Discord User from Customer ID") {
            const entry = await db.customers.findOne({ stripe: customer });

            if (entry) return { og: customer, discord: entry.discord };

            const result = await stripe.customers.retrieve(customer).catch(() => {});
            if (!result) return { error: "This customer ID does not exist." };

            return { error: "This customer ID is not assigned to a user." };
        } else if (action === "Fetch Customer IDs from Discord User") {
            const entries = await db.customers.find({ discord }).toArray();

            return { og: discord, customers: entries.map((x) => x.stripe) };
        }

        return { error: "NotImplemented" };
    },
};
