import { APIGuild, Guild } from "discord.js";
import { getClientFromToken } from "./bot/clients.js";
import db from "./lib/db.js";

export enum PremiumTier {
    FREE = 0,
    BASIC,
    ULTIMATE,
}

export const premiumBenefits: Record<PremiumTier, { vanityClient: boolean }> = {
    [PremiumTier.FREE]: { vanityClient: false },
    [PremiumTier.BASIC]: { vanityClient: false },
    [PremiumTier.ULTIMATE]: { vanityClient: true },
};

export async function getToken(ctx: APIGuild | Guild | { guild: APIGuild | Guild }) {
    const guild = "guild" in ctx ? ctx.guild : ctx;

    const doc = await db.guilds.findOne({ guild: guild.id });
    if (!doc?.token || !premiumBenefits[doc.tier].vanityClient) return Bun.env.TOKEN!;

    return doc.token!;
}

export async function getClient(ctx: APIGuild | Guild | { guild: APIGuild | Guild }) {
    try {
        return await getClientFromToken(await getToken(ctx));
    } catch {
        return await getClientFromToken(Bun.env.TOKEN!);
    }
}
