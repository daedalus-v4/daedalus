import { ButtonInteraction, ButtonStyle, ChannelType, ComponentType, OverwriteType, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import { db, getColor, getLimitFor, getPremiumBenefitsFor, isModuleEnabled } from "shared/db.js";
import { formatMessage } from "shared/format-custom-message.js";
import { isAssignedClient } from "../../lib/premium.js";
import { mdash, template } from "../lib/format.js";
import { invokeLog } from "../lib/logging.js";

export default async function (cmd: ButtonInteraction | StringSelectMenuInteraction, id: string) {
    await cmd.deferReply({ ephemeral: true });

    if (!(await isAssignedClient(cmd.guild!))) return template.error("This server is not using this client. This prompt needs to be set up again.");
    if (!(await isModuleEnabled(cmd.guild!.id, "tickets"))) return template.error("The tickets module is disabled.");

    const doc = await db.ticketsSettings.findOne({ guild: cmd.guild!.id });
    if (!doc) return;

    const prompt = doc.prompts.slice(0, await getLimitFor(cmd.guild!, "ticketPromptCount")).find((prompt) => prompt.message === cmd.message.id);

    if (prompt?.error)
        return template.error(`This ticket prompt is out of sync due to an error with its last save. Server management can fix on the dashboard.`);

    if (!prompt) return;

    const { multiTickets, ticketTargetCountLimit, customizeTicketOpenMessage } = await getPremiumBenefitsFor(cmd.guild!.id);

    if (cmd.isStringSelectMenu()) {
        if (!multiTickets) throw "This is a premium-only feature, but this server no longer has Daedalus premium.";
        id = cmd.values[0];
    }

    const target = prompt.multi
        ? prompt.targets
              .filter((x) => !!x.logChannel && !!x.category)
              .slice(0, ticketTargetCountLimit)
              .find((x) => `${x.id}` === id)
        : prompt.targets[0];

    if (!target) throw "Could not find the referenced ticket target. Please contact Daedalus support (not server staff) if this issue persists.";

    const log = await cmd.guild!.channels.fetch(target.logChannel!).catch(() => {
        throw "Could not fetch the ticket log channel. Please contact server staff if this issue persists.";
    });

    const category = await cmd.guild!.channels.fetch(target.category!).catch(() => {
        throw "Could not fetch the ticket category channel. Please contact server staff if this issue persists.";
    });

    if (!log?.isTextBased() || category?.type !== ChannelType.GuildCategory) throw "Invalid channel type(s). Please contact support if this issue persists.";

    const existing = await db.tickets.findOne({ guild: cmd.guild!.id, user: cmd.user.id, prompt: prompt.id, target: target.id, closed: false });

    if (existing)
        if (cmd.guild!.channels.cache.has(existing.channel)) return template.info(`You already have an open ticket at <#${existing.channel}>.`);
        else await db.tickets.updateOne({ _id: existing._id }, { $set: { closed: true } });

    const channel = await category.children.create({
        name: cmd.user.tag,
        permissionOverwrites: [
            ...category.permissionOverwrites.cache.toJSON(),
            ...(category.permissionOverwrites.cache.has(cmd.user.id)
                ? []
                : [{ type: OverwriteType.Member, id: cmd.user.id, allow: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages }]),
        ],
    });

    let uuid: string;

    do {
        uuid = crypto.randomUUID();
    } while ((await db.tickets.countDocuments({ uuid })) > 0);

    await db.tickets.insertOne({
        guild: cmd.guild!.id,
        user: cmd.user.id,
        prompt: prompt.id,
        target: target.id,
        uuid,
        closed: false,
        channel: channel.id,
        created: Date.now(),
        messages: [{ type: "open", time: Date.now() }],
    });

    let content = "";
    if (target.pingHere) content = "@here ";
    for (const role of target.pingRoles) if (cmd.guild!.roles.cache.has(role)) content += `<@&${role}> `;
    content += `${cmd.user} `;

    let posted = false;

    if (customizeTicketOpenMessage && target.postCustomOpenMessage)
        try {
            const data = await formatMessage(target.customOpenMessage.parsed, { guild: cmd.guild, member: await cmd.guild!.members.fetch(cmd.user) });

            data.content ??= "";
            data.content = `${content}${data.content}`.slice(0, 2000);
            data.allowedMentions = { parse: ["everyone", "roles", "users"] };

            await channel.send(data);
        } catch (error) {
            invokeLog("botError", cmd.guild!, () =>
                template.logerror(`Bot Error ${mdash} Tickets`, `Error posting custom on-open message in ${channel}:\n\`\`\`\n${error}\n\`\`\``),
            );
        }

    if (!posted)
        await channel
            .send({
                content,
                embeds: [
                    {
                        title: "New Ticket",
                        description: `Your ticket was created, ${cmd.user}. Please enter your inquiry below and wait for staff to address this ticket.`,
                        color: await getColor(cmd.guild!),
                    },
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            { type: ComponentType.Button, style: ButtonStyle.Link, label: "View on Dashboard", url: `${Bun.env.DOMAIN}/ticket/${uuid}` },
                        ],
                    },
                ],
                allowedMentions: { parse: ["everyone", "roles", "users"] },
            })
            .catch(() => {});

    await log
        .send({ embeds: [{ title: "Ticket Created", description: `A ticket was opened with ${cmd.user}: ${channel}.`, color: await getColor(cmd.guild!) }] })
        .catch(() => {});

    return template.success(`Your ticket has been created: ${channel}.`);
}
