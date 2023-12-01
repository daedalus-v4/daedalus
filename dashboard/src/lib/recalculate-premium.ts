import { API, OWNER, PRICE_T1_M, PRICE_T1_Y, PRICE_T2_M, PRICE_T2_Y } from "$env/static/private";
import { PremiumTier } from "shared";
import { db } from "shared/db.js";
import { getPortalSessions, stripe } from "./stripe.js";

export default async function recalculate(user?: string, guild?: string) {
    const enable: string[] = [];
    const disable: string[] = [];

    if (user) {
        const keys = (await db.premiumKeys.findOne({ user }))?.keys ?? [];
        if (keys.length === 0) return new Response();

        let basicTotal = 0;
        let ultimateTotal = 0;

        if (user === OWNER) basicTotal = ultimateTotal = Infinity;

        for (const session of await getPortalSessions(user, false))
            for (const sub of session!.subscriptions)
                if (sub.level === "basic") basicTotal += sub.quantity;
                else if (sub.level === "ultimate") ultimateTotal += sub.quantity;

        for (const key of keys) {
            const ultimate = key.startsWith("upk_");
            const valid = ultimate ? ultimateTotal-- > 0 : basicTotal-- > 0;

            if (valid) enable.push(key);
            else disable.push(key);
        }
    } else {
        let more = true;
        let bar: string | undefined;

        const basicTotal: Record<string, number> = {};
        const ultimateTotal: Record<string, number> = {};

        const customerMap = Object.fromEntries((await db.customers.find().toArray()).map((entry) => [entry.stripe, entry.discord]));

        while (more) {
            const request = await stripe.customers.list({ limit: 100, ending_before: bar, expand: ["data.subscriptions"] });
            more = request.has_more;

            if (request.data.length > 0) bar = request.data[0].id;

            for (const customer of request.data) {
                const key = customerMap[customer.id];

                for (const subscription of customer.subscriptions?.data ?? []) {
                    for (const item of subscription.items.data) {
                        if (item.price.id === PRICE_T1_M || item.price.id === PRICE_T1_Y) basicTotal[key] = (basicTotal[key] ?? 0) + (item.quantity ?? 1);
                        else if (item.price.id === PRICE_T2_M || item.price.id === PRICE_T2_Y)
                            ultimateTotal[key] = (ultimateTotal[key] ?? 0) + (item.quantity ?? 1);
                    }
                }
            }
        }

        basicTotal[OWNER] = Infinity;
        ultimateTotal[OWNER] = Infinity;

        for await (const { user, keys } of db.premiumKeys.find()) {
            if (!basicTotal[user] && !ultimateTotal[user]) {
                await db.premiumKeyBindings.updateMany({ key: { $in: keys } }, { $set: { disabled: true } });
                continue;
            }

            for (const key of keys) {
                const ultimate = key.startsWith("upk_");
                const valid = ultimate ? (ultimateTotal[user] ?? 0) > 0 : (basicTotal[user] ?? 0) > 0;
                if (valid) ultimate ? ultimateTotal[user]-- : basicTotal[user]--;

                if (valid) enable.push(key);
                else disable.push(key);
            }
        }
    }

    if (enable.length > 0) await db.premiumKeyBindings.updateMany({ key: { $in: enable } }, { $unset: { disabled: 1 } });
    if (disable.length > 0) await db.premiumKeyBindings.updateMany({ key: { $in: disable } }, { $set: { disabled: true } });

    const bindings = await db.premiumKeyBindings.find({ disabled: { $ne: true } }).toArray();

    const guildSet = new Set([...(await db.guilds.find().toArray()).map((entry) => entry.guild), ...(guild ? [guild] : [])]);
    for (const binding of bindings) guildSet.add(binding.guild);

    const guilds = [...guildSet];

    const tiers = Object.fromEntries(guilds.map((guild) => [guild, PremiumTier.FREE]));

    for (const binding of bindings)
        tiers[binding.guild] = Math.max(tiers[binding.guild], binding.key.startsWith("upk_") ? PremiumTier.ULTIMATE : PremiumTier.BASIC);

    const old: Record<string, PremiumTier> = {};
    for await (const guild of db.guilds.find({ guild: { $in: Object.keys(tiers) } })) old[guild.guild] = guild.tier;

    const changes = Object.entries(tiers).filter(([guild, tier]) => old[guild] !== tier);
    if (changes.length === 0) return;

    await db.guilds.bulkWrite(changes.map(([guild, tier]) => ({ updateOne: { filter: { guild }, update: { $set: { tier } }, upsert: true } })));

    const entries = await db.guilds
        .find({
            guild: { $nin: (await db.premiumOverrides.find({ vanityClient: true }).toArray()).map((x) => x.guild) },
            token: { $ne: null },
            tier: { $ne: PremiumTier.ULTIMATE },
        })
        .toArray();

    if (entries.length > 0)
        await fetch(`${API}/reset-client`, {
            method: "POST",
            body: JSON.stringify({ guilds: entries.map((x) => x.guild) }),
            headers: { "Content-Type": "application/json" },
        }).catch(() => {});

    await fetch(`${API}/premium-changes`, {
        method: "POST",
        body: JSON.stringify({ changes: changes.map(([x, y]) => [x, old[x], y]) }),
        headers: { "Content-Type": "application/json" },
    }).catch(() => {});
}
