import Argentium from "argentium";
import { Channel, Events } from "discord.js";
import { db, getLimitFor } from "shared/db.js";
import { sendCustomMessage, skip } from "../utils.js";

export default (app: Argentium) =>
    app.on(Events.MessageCreate, async (message) => {
        if (!message.guild) return;
        if (message.author.id === message.client.user.id) return;
        if (await skip(message.guild, "autoresponder")) return;

        const settings = await db.autoresponderSettings.findOne({ guild: message.guild.id });
        if (!settings) return;

        const { triggers } = settings;
        if (triggers.length === 0) return;

        let channelAllowedByDefault: boolean | undefined;
        let roleAllowedByDefault: boolean | undefined;

        for (const trigger of triggers.slice(0, await getLimitFor(message.guild, "autoresponderCount"))) {
            if (!trigger.enabled) continue;
            if (!trigger.respondToBotsAndWebhooks && message.author.bot) continue;

            const content = trigger.caseInsensitive ? message.content.toLowerCase() : message.content;
            const match = trigger.caseInsensitive ? trigger.match.toLowerCase() : trigger.match;

            if (trigger.wildcard ? !content.includes(match) : content !== match) continue;

            let allowed = !trigger.onlyInAllowedChannels;

            let channel: Channel | null = message.channel;
            if (channel.isDMBased()) continue;

            do {
                if (trigger.blockedChannels.includes(channel.id)) {
                    allowed = false;
                    break;
                } else if (trigger.allowedChannels.includes(channel.id)) {
                    allowed = true;
                    break;
                }
            } while ((channel = channel.parent));

            if (!allowed) continue;

            if (message.member?.roles.cache.hasAny(...trigger.blockedRoles)) continue;
            if (trigger.onlyToAllowedRoles && !message.member?.roles.cache.hasAny(...trigger.allowedRoles)) continue;

            if (!trigger.bypassDefaultChannelSettings) {
                if (channelAllowedByDefault === undefined) {
                    channelAllowedByDefault = !settings.onlyInAllowedChannels;

                    let channel: Channel | null = message.channel;
                    if (channel.isDMBased()) continue;

                    do {
                        if (settings.blockedChannels.includes(channel.id)) {
                            channelAllowedByDefault = false;
                            break;
                        } else if (settings.allowedChannels.includes(channel.id)) {
                            channelAllowedByDefault = true;
                            break;
                        }
                    } while ((channel = channel.parent));
                }

                if (!channelAllowedByDefault) continue;
            }

            if (!trigger.bypassDefaultRoleSettings) {
                if (roleAllowedByDefault === undefined)
                    roleAllowedByDefault =
                        !message.member?.roles.cache.hasAny(...settings.blockedRoles) &&
                        (!settings.onlyToAllowedRoles || message.member?.roles.cache.hasAny(...settings.allowedRoles));

                if (!roleAllowedByDefault) continue;
            }

            await sendCustomMessage(
                trigger.replyMode === "normal" ? message.channel : message,
                trigger.message,
                "Autoresponder",
                `Error responding to ${message.url}.`,
                {
                    guild: message.guild,
                    user: message.author,
                    member: message.member,
                },
                false,
                trigger.replyMode === "ping-reply",
            );

            if (trigger.reaction) await message.react(trigger.reaction).catch(() => {});
        }
    });
