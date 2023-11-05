import { Awaitable, Guild, GuildChannel, MessageCreateOptions, TextBasedChannel, ThreadChannel } from "discord.js";
import { DbLoggingSettings, logEvents } from "shared";
import { db } from "shared/db.js";
import { log } from "../../lib/log.js";
import { skip } from "../modules/utils.js";

export async function invokeLog(
    key: string,
    context: Guild | GuildChannel | ThreadChannel,
    output: (settings: DbLoggingSettings) => Awaitable<void | string | MessageCreateOptions | (string | MessageCreateOptions)[]>,
) {
    if (!context) return;

    const guild = "guild" in context ? context.guild : context;
    if (await skip(guild, "logging")) return;

    const settings = await db.loggingSettings.findOne({ guild: guild.id });
    if (!settings) return;

    const { category } = logEvents[key];

    const categorySettings = settings.categories[category];
    const eventSettings = categorySettings.events[key];

    if (!categorySettings.enabled || !eventSettings) return;

    let channel = "guild" in context ? context : null;

    while (channel) {
        if (settings.ignoredChannels.includes(channel.id)) return;
        channel = channel.parent;
    }

    let channelId: string | null = null;
    let webhook: string | undefined;
    let useWebhook: boolean = false;

    useWebhook = settings.useWebhook;
    if (settings.useWebhook) webhook = settings.defaultWebhook;
    else channelId = settings.defaultChannel;

    for (const obj of [categorySettings, eventSettings])
        if (obj.useWebhook) {
            if (obj.outputWebhook) {
                useWebhook = true;
                webhook = obj.outputWebhook;
            }
        } else if (obj.outputChannel) {
            useWebhook = false;
            channelId = obj.outputChannel;
        }

    if (useWebhook ? !webhook : !channelId) return;
    let location: TextBasedChannel | undefined;

    if (useWebhook) {
        const url = new URL(webhook!);
        url.searchParams.set("wait", "true");
        webhook = url.toString();
    } else
        try {
            const ch = await guild.channels.fetch(channelId!);
            if (!ch?.isTextBased()) return;
            location = ch;
        } catch {
            return;
        }

    let data = await output(settings);
    if (!data) return;

    data = Array.isArray(data) ? data : [data];

    for (const entry of data)
        try {
            if (useWebhook) await fetch(webhook!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
            else await location!.send(entry);
        } catch (error: any) {
            log.error(error, "ee988e02-c7b1-48c9-b388-0bb4f6bd01b7");
        }
}
