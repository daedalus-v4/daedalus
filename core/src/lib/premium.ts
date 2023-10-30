import { APIGuild, Guild } from "discord.js";
import { premiumBenefits } from "shared";
import { db } from "shared/db.js";
import { getClientFromToken } from "../bot/clients.js";

export async function getToken(ctx?: string | APIGuild | Guild | { guild: APIGuild | Guild }) {
    if (!ctx) return Bun.env.TOKEN!;

    const guild = typeof ctx === "string" ? ctx : "guild" in ctx ? ctx.guild.id : ctx.id;

    const doc = await db.guilds.findOne({ guild });
    if (!doc?.token || !premiumBenefits[doc.tier].vanityClient) return Bun.env.TOKEN!;

    return doc.token!;
}

export async function getClient(ctx?: string | APIGuild | Guild | { guild: APIGuild | Guild }) {
    try {
        return await getClientFromToken(await getToken(ctx));
    } catch {
        return await getClientFromToken(Bun.env.TOKEN!);
    }
}
