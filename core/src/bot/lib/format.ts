import { APIEmbed, APIGuild, BaseMessageOptions, Colors, Guild } from "discord.js";
import { db } from "shared/db.js";

export async function colorEmbed(ctx: APIGuild | Guild | { guild: APIGuild | Guild }, embed: APIEmbed): Promise<BaseMessageOptions> {
    const guild = "guild" in ctx ? ctx.guild : ctx;
    return { embeds: [{ ...embed, color: (await db.guildSettings.findOne({ guild: guild.id }))?.embedColor ?? 0x009688 }] };
}

export function embed(title: string, description: string, color: number): BaseMessageOptions {
    return { embeds: [{ title, description, color }] };
}

export const template = {
    success: (body: string) => embed("OK!", body, Colors.Green),
    error: (body: string) => embed("Error!", body, Colors.Red),
    info: (body: string) => embed("Info", body, Colors.Blue),
    logerror: (context: string, body: string) => embed(`Bot Error: ${context}`, body, Colors.Red),
};
