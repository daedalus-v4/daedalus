import { APIGuild, Guild } from "discord.js";
import { premiumBenefits } from "shared";
import { db } from "shared/db.js";
import { getClientFromToken } from "../bot/clients.js";

export async function getToken(ctx?: string | APIGuild | Guild | { guild: APIGuild | Guild }) {
    return (await getTokens([ctx ?? ""]))[0];
}

export async function getTokens(ctx?: (string | APIGuild | Guild | { guild: APIGuild | Guild })[]) {
    if (!ctx?.length) return [];

    const guilds = ctx.map((x) => (typeof x === "string" ? x : "guild" in x ? x.guild.id : x.id));

    const docs = Object.fromEntries((await db.guilds.find({ guild: { $in: guilds } }).toArray()).map((x) => [x.guild, x]));
    return guilds.map((guild) => (!docs[guild]?.token || !premiumBenefits[docs[guild].tier].vanityClient ? Bun.env.TOKEN! : docs[guild].token!));
}

export async function getClient(ctx?: string | APIGuild | Guild | { guild: APIGuild | Guild }) {
    try {
        return await getClientFromToken(await getToken(ctx));
    } catch {
        return await getClientFromToken(Bun.env.TOKEN!);
    }
}

export async function isAssignedClient(ctx: Guild | { guild: Guild }) {
    const guild = "guild" in ctx ? ctx.guild : ctx;
    return guild.client.token === (await getClient(ctx)).token;
}

export async function getClients(ctx?: (string | APIGuild | Guild | { guild: APIGuild | Guild })[]) {
    return await Promise.all((await getTokens(ctx)).map((token) => getClientFromToken(token).catch(() => getClientFromToken(Bun.env.TOKEN!))));
}
