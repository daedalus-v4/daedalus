import { ActivityType, Client, Events, IntentsBitField, Partials, PresenceStatusData } from "discord.js";
import { db } from "shared/db.js";
import clientTasks from "../lib/client-tasks.js";
import { log } from "../lib/log.js";
import argentium from "./argentium.js";

export const clientCache: Record<string, Client> = {};
export const clientLoops: Record<string, NodeJS.Timer[]> = {};

export async function getClientFromToken(token: string) {
    if (!clientCache[token]) {
        log.info(`Obtaining client ${token.slice(0, 5)}...${token.slice(-5)}`);

        const entry = token === Bun.env.TOKEN ? null : await db.guilds.findOne({ token });

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
            presence: {
                status: (entry?.status as PresenceStatusData) ?? "online",
                activities: entry?.activityType
                    ? entry.activityType === "Custom" && (entry.status ?? "").trim() === ""
                        ? []
                        : [{ type: ActivityType[entry.activityType as keyof typeof ActivityType] ?? ActivityType.Custom, name: entry.statusText ?? "" }]
                    : [{ type: ActivityType.Watching, name: "for /help" }],
            },
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
