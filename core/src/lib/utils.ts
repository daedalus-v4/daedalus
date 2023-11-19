import { ChannelType } from "discord.js";
import * as natural from "natural";

export function fuzzy(string: string, query: string) {
    if (!query) return true;

    query = query.toLowerCase();
    string = string.toLowerCase();

    let index = 0;

    for (const char of string) {
        if (char === query.charAt(index)) index++;
        if (index >= query.length) return true;
    }

    return false;
}

export const textlike = [
    ChannelType.AnnouncementThread,
    ChannelType.GuildForum,
    ChannelType.GuildStageVoice,
    ChannelType.GuildText,
    ChannelType.GuildVoice,
    ChannelType.PrivateThread,
    ChannelType.PublicThread,
] as const;

const tokenizer = new natural.WordTokenizer();

export const tokenize = tokenizer.tokenize.bind(tokenizer);
export const stem = natural.PorterStemmer.tokenizeAndStem;
