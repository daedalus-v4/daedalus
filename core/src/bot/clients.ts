import { ActivityType, Client, Events, IntentsBitField, Partials } from "discord.js";
import clientTasks from "../lib/client-tasks.js";
import { log } from "../lib/log.js";
import argentium from "./argentium.js";

export const clientCache: Record<string, Client> = {};
export const clientLoops: Record<string, NodeJS.Timer[]> = {};

export async function getClientFromToken(token: string) {
    if (!clientCache[token]) {
        log.info(`Obtaining client ${token.slice(0, 5)}...${token.slice(-5)}`);

        const client = (clientCache[token] = new Client({
            intents:
                IntentsBitField.Flags.Guilds |
                IntentsBitField.Flags.GuildMembers |
                IntentsBitField.Flags.GuildModeration |
                IntentsBitField.Flags.GuildEmojisAndStickers |
                IntentsBitField.Flags.GuildWebhooks |
                IntentsBitField.Flags.GuildInvites |
                IntentsBitField.Flags.GuildVoiceStates |
                IntentsBitField.Flags.GuildMessages |
                IntentsBitField.Flags.GuildMessageReactions |
                IntentsBitField.Flags.DirectMessages |
                IntentsBitField.Flags.MessageContent |
                IntentsBitField.Flags.GuildScheduledEvents,
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            allowedMentions: { parse: [] },
            failIfNotExists: false,
            presence: { activities: [{ type: ActivityType.Watching, name: "for /help" }] },
        }));

        client.setMaxListeners(20);

        client.on(Events.ClientReady, async () => {
            await argentium.postApply(client);
            clientTasks(client);
            log.info(`Client ${token.slice(0, 5)}...${token.slice(-5)} is ready.`);
        });

        await argentium.preApply(client);
        await client.login(token);
    }

    return clientCache[token];
}

export function getAllClients() {
    return Object.values(clientCache);
}
