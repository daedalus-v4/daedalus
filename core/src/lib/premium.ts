import { APIGuild, Guild, OAuth2Guild } from "discord.js";
import { premiumBenefits } from "shared";
import { db } from "shared/db.js";
import { clientCache, clientLoops, getClientFromToken } from "../bot/clients.js";
import { log } from "./log.js";

type GuildLike = APIGuild | Guild | OAuth2Guild;

export async function getToken(ctx?: string | GuildLike | { guild: GuildLike }) {
    return (await getTokens([ctx ?? ""]))[0];
}

export async function getTokens(ctx?: (string | GuildLike | { guild: GuildLike })[]) {
    if (!ctx?.length) return [];

    const guilds = ctx.map((x) => (typeof x === "string" ? x : "guild" in x ? x.guild.id : x.id));

    const docs = Object.fromEntries((await db.guilds.find({ guild: { $in: guilds } }).toArray()).map((x) => [x.guild, x]));
    return guilds.map((guild) => (!docs[guild]?.token || !premiumBenefits[docs[guild].tier].vanityClient ? Bun.env.TOKEN! : docs[guild].token!));
}

export async function getClient(ctx?: string | GuildLike | { guild: GuildLike }) {
    if (ctx)
        try {
            return await getClientFromToken(await getToken(ctx));
        } catch {}

    return await getClientFromToken(Bun.env.TOKEN!);
}

export async function isAssignedClient(ctx: Guild | OAuth2Guild | { guild: Guild }) {
    const guild = "guild" in ctx ? ctx.guild : ctx;
    return guild.client.token === (await getClient(ctx)).token;
}

export async function getClients(ctx?: (string | APIGuild | Guild | { guild: APIGuild | Guild })[]) {
    return await Promise.all((await getTokens(ctx)).map((token) => getClientFromToken(token).catch(() => getClientFromToken(Bun.env.TOKEN!))));
}

export async function assignClient(guild: string, token: string) {
    if ((await db.guilds.countDocuments({ token })) > 0) return null;

    const client = await getClientFromToken(token).catch((e) => log.error(e, "4841cb33-b759-495f-b332-ceca6809d2da"));
    if (!client) return null;

    try {
        await client.guilds.fetch(guild);
    } catch {
        log.error(
            `Client with token ${token.slice(0, 5)}...${token.slice(-5)} could not fetch binding guild ${guild}.`,
            "85928c8a-a733-495e-a994-45547e3b352b",
        );

        return null;
    }

    await db.guilds.updateOne({ guild }, { $set: { token } }, { upsert: true });
    log.info(`Bound client with token ${token.slice(0, 5)}...${token.slice(-5)} to guild ${guild}.`);

    return client.user?.tag;
}

export async function resetClient(guild: string) {
    try {
        const entry = await db.guilds.findOne({ guild });

        if (entry?.token) {
            const { token } = entry;

            const client = await getClientFromToken(token);
            await client.application?.commands.set([]);
            await client.destroy();

            clientLoops[token].forEach(clearInterval);

            delete clientLoops[token];
            delete clientCache[token];

            log.info(`Liberated client with token ${token.slice(0, 5)}...${token.slice(-5)}`);
        }
    } catch {}

    await db.guilds.updateOne({ guild }, { $unset: { token: 1 } });
    log.info(`Unbound client from guild ${guild}.`);
}
