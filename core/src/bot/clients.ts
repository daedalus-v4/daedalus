import { Client, Events, IntentsBitField } from "discord.js";
import { log } from "../lib/log.js";
import argentium from "./argentium.js";

export const clientCache: Record<string, Client> = {};

export async function getClientFromToken(token: string) {
    if (!clientCache[token]) {
        log.info(`Obtaining client ${token.slice(0, 5)}...${token.slice(-5)}`);

        clientCache[token] = new Client({ intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers });
        await clientCache[token].login(token);

        await argentium.preApply(clientCache[token]);
        await new Promise((r) => clientCache[token].on(Events.ClientReady, r));
        await argentium.postApply(clientCache[token]);
    }

    return clientCache[token];
}

export function getAllClients() {
    return Object.values(clientCache);
}
