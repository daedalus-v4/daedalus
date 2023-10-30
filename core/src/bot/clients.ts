import { Client, Events } from "discord.js";
import { log } from "../lib/log.js";
import argentium from "./argentium.js";

const cache: Record<string, Client> = {};

export async function getClientFromToken(token: string) {
    if (!cache[token]) {
        log.info(`Obtaining client ${token.slice(0, 5)}...${token.slice(-5)}`);

        cache[token] = new Client({ intents: 0 });
        await cache[token].login(token);

        await argentium.preApply(cache[token]);
        await new Promise((r) => cache[token].on(Events.ClientReady, r));
        await argentium.postApply(cache[token]);
    }

    return cache[token];
}

export function getAllClients() {
    return Object.values(cache);
}
