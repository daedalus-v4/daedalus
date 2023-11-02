import Argentium from "argentium";
import { Events } from "discord.js";
import { formatMessage } from "shared";
import { db, isModuleEnabled } from "shared/db.js";
import { template } from "../../lib/format.js";
import { invokeLog } from "../../lib/logging.js";

export default (app: Argentium) =>
    app.on(Events.GuildMemberAdd, async (member) => {
        if (!(await isModuleEnabled(member.guild.id, "welcome"))) return;

        const settings = await db.welcomeSettings.findOne({ guild: member.guild.id });
        if (!settings?.channel) return;

        const channel = await member.guild.channels
            .fetch(settings.channel, { force: true })
            .catch(() =>
                invokeLog("botError", member.guild, ({ ignoredChannels }) =>
                    ignoredChannels.includes(settings.channel!)
                        ? []
                        : template.logerror("Welcome Module", `The welcome channel (<#${settings.channel}>) could not be fetched.`),
                ),
            );

        if (!channel) return;

        if (!channel?.isTextBased())
            return void invokeLog("botError", member.guild, ({ ignoredChannels }) =>
                ignoredChannels.includes(settings.channel!)
                    ? []
                    : template.logerror(
                          "Welcome Module",
                          `The welcome channel (<#${settings.channel}>) is not of the correct channel type. This is probably not your fault.`,
                      ),
            );

        try {
            await channel.send(await formatMessage(settings.message.parsed, { member: await member.fetch() }));
        } catch (error) {
            invokeLog("botError", member.guild, ({ ignoredChannels }) =>
                ignoredChannels.includes(settings.channel!)
                    ? []
                    : template.logerror(
                          "Welcome Module",
                          `The welcome message for ${member} could not be sent. Check the bot's permissions in <#${settings.channel}> and ensure your custom message is valid. Here's some details about the error:\n\`\`\`\n${error}\n\`\`\``,
                      ),
            );
        }
    });
