import { TOKEN } from "$env/static/private";
import { Client, Events } from "discord.js";
import { db, getPremiumBenefitsFor } from "shared/db.js";

const defaultClient = new Client({ intents: 0 });
await defaultClient.login(TOKEN);

const clientCache: Record<string, Client> = {};

export default async function (guild?: string) {
    if (!guild) return defaultClient;

    const benefits = await getPremiumBenefitsFor(guild);
    if (!benefits.vanityClient) return defaultClient;

    const { token } = (await db.guilds.findOne({ guild })) ?? {};
    if (!token) return defaultClient;

    if (clientCache[token]) return clientCache[token];

    try {
        const client = (clientCache[token] = new Client({ intents: 0 }));

        const promise = new Promise((r) => client.on(Events.ClientReady, r));
        client.login(token);
        await promise;

        return client;
    } catch {
        return defaultClient;
    }
}

setInterval(async () => {
    const seen = (await db.guilds.find().toArray()).map((x) => x.token).filter((x) => x);

    for (const key of Object.keys(clientCache))
        if (!seen.includes(key)) {
            await clientCache[key].destroy().catch(() => {});
            delete clientCache[key];
        }
}, 24 * 60 * 60 * 1000);
