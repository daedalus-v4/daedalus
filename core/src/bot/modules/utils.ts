import { Awaitable, Guild, TextBasedChannel } from "discord.js";
import { CustomMessageContext, MessageData } from "shared";
import { isModuleEnabled } from "shared/db.js";
import { formatMessage } from "shared/format-custom-message.js";
import { isAssignedClient } from "../../lib/premium.js";
import { template } from "../lib/format.js";
import { invokeLog } from "../lib/logging.js";

export async function skip(guild: Guild, module: string) {
    return !((await isAssignedClient(guild)) && (await isModuleEnabled(guild.id, module)));
}

export async function getTextChannel(guild: Guild, id: string, moduleTitle: string, contextName: string) {
    const channel = await guild.channels
        .fetch(id, { force: true })
        .catch(() =>
            invokeLog("botError", guild, ({ ignoredChannels }) =>
                ignoredChannels.includes(id) ? [] : template.logerror(`${moduleTitle} Module`, `The ${contextName} channel (<#${id}>) could not be fetched.`),
            ),
        );

    if (!channel) return;

    if (!channel.isTextBased())
        return void invokeLog("botError", guild, ({ ignoredChannels }) =>
            ignoredChannels.includes(id)
                ? []
                : template.logerror(
                      `${moduleTitle} Module`,
                      `The ${contextName} channel (<#${id}>) is not of a valid channel type. This is probably not your fault and should likely be reported.`,
                  ),
        );

    return channel;
}

export async function sendCustomMessage(
    channel: TextBasedChannel,
    data: MessageData,
    moduleTitle: string,
    errorMessage: string,
    context?: CustomMessageContext,
    allowPings?: boolean,
) {
    try {
        return await channel.send(await formatMessage(data.parsed, context ?? {}, allowPings));
    } catch (error) {
        !channel.isDMBased() &&
            invokeLog("botError", channel, () =>
                template.logerror(
                    `Bot Error — Custom Message — ${moduleTitle} Module`,
                    `${errorMessage} Check the bot's permissions in ${channel} and ensure your custom message is valid. Here's some details about the error:\n\`\`\`\n${error}\n\`\`\``,
                ),
            );
    }
}

export async function fetchAndSendCustom(
    guild: Guild,
    id: string,
    moduleTitle: string,
    contextName: string,
    data: MessageData,
    errorMessage: string,
    context?: () => Awaitable<CustomMessageContext>,
    allowPings?: boolean,
) {
    const channel = await getTextChannel(guild, id, moduleTitle, contextName);
    if (channel) return await sendCustomMessage(channel, data, moduleTitle, errorMessage, await context?.(), allowPings);
}
