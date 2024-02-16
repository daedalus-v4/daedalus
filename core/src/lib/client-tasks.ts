import { Client } from "discord.js";
import { db } from "shared/db.js";
import { clientLoops } from "../bot/clients.js";
import { skip } from "../bot/modules/utils.js";
import { addXp, isChannelBlocked, isUserBlocked } from "../bot/modules/xp/utils.js";
import { log } from "./log.js";

function startLoop(client: Client, fn: (client: Client) => any, interval: number, uuid: string, startImmediately: boolean = true) {
    async function inner(client: Client) {
        try {
            await fn(client);
        } catch (error) {
            log.error(error, uuid);
        }
    }

    if (startImmediately) inner(client);
    (clientLoops[client.token!] ??= []).push(setInterval(() => inner(client), interval));
}

const tracking: Record<string, Set<string>> = {};

export default function (client: Client) {
    startLoop(
        client,
        async (client) => {
            const tracker = (tracking[client.user!.id] ??= new Set());
            const seen = new Set<string>();

            for (const guild of (await client.guilds.fetch()).values()) {
                if (await skip(guild, "xp")) continue;

                const settings = await db.xpSettings.findOne({ guild: guild.id });

                try {
                    for (const state of (await guild.fetch()).voiceStates.cache.values()) {
                        if (!state.member) continue;

                        seen.add(state.member.id);

                        if (tracker.has(state.member.id)) {
                            if (!state.channel) continue;
                            if ((await isChannelBlocked(state.channel, settings)) || (await isUserBlocked(state.member, settings))) continue;

                            await addXp(state.channel, state.member, 0, 1, settings);
                        } else tracker.add(state.member.id);
                    }
                } catch (error) {
                    log.error(error, "406a1ccd-ff4f-4383-b6e4-a9859c01c11a");
                }
            }

            for (const id of [...tracker]) if (!seen.has(id)) tracker.delete(id);
        },
        60000,
        "ac9d3620-9a37-45be-88ac-f5d757696220",
    );
}
