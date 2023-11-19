import Argentium from "argentium";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
    MessageContextMenuCommandInteraction,
    TextInputStyle,
    User,
    UserContextMenuCommandInteraction,
} from "discord.js";
import { db, getColor } from "shared/db.js";
import { expand, template } from "../../lib/format.js";
import { parseMessageURL } from "../../lib/parsing.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x
            .message((x) =>
                x.name("Flag Message").fn(async ({ _, message }) => {
                    return await report(_, message);
                }),
            )
            .slash((x) =>
                x
                    .key("flag")
                    .description("flag a message for moderators")
                    .stringOption("url", "the URL of the message", { required: true })
                    .fn(async ({ _, url }) => {
                        const [gid, cid, mid] = parseMessageURL(url);
                        if (gid !== _.guild!.id) throw "That link points to a message in a different server.";

                        const channel = await _.guild!.channels.fetch(cid);
                        if (!channel?.isTextBased()) throw "Could not find the channel in which the message to which that message link points to is.";

                        const message = await channel.messages.fetch(mid).catch(() => {});
                        if (!message) throw "Could not find that message.";

                        return await report(_, message);
                    }),
            )
            .user((x) =>
                x.name("Report User").fn(async ({ _, user }) => {
                    return await report(_, user);
                }),
            )
            .slash((x) =>
                x
                    .key("report")
                    .description("report a user to moderators")
                    .userOption("user", "the user to report", { required: true })
                    .fn(async ({ _, user }) => {
                        return await report(_, user);
                    }),
            ),
    );

async function report(_: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | ChatInputCommandInteraction, object: Message | User) {
    if (object instanceof Message) {
        if (object.author.id === _.user.id) throw "You cannot flag your own messages.";
    } else if (object.id === _.user.id) throw "You cannot report yourself.";

    const settings = await db.reportsSettings.findOne({ guild: _.guild!.id });
    if (!settings?.outputChannel) throw "Reports have not been set up in this server.";

    let channel = await _.guild!.channels.fetch(settings.outputChannel).catch(() => {});
    if (!channel?.isTextBased()) throw "Could not retrieve the report channel for this server.";

    const message = object instanceof Message;

    await _.showModal({
        customId: "report",
        title: message ? "Flag Message" : "Report User",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "reason",
                        required: !message,
                        label: "Reason for reporting",
                        placeholder: "You have 60 mintues to complete this operation. Only report actual rule violations.",
                        maxLength: 1024,
                    },
                ],
            },
        ],
    });

    const modal = await _.awaitModalSubmit({ time: 60 * 60 * 1000 }).catch(() => {});
    if (!modal) return;

    channel = await _.guild!.channels.fetch(settings.outputChannel).catch(() => {});
    if (!channel?.isTextBased()) return void (await modal.reply(template.error("Could not retrieve the report channel for this server.")));

    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");

    const post = await channel.send({
        content: settings.pingRoles.map((x) => `<@&${x}>`).join(" "),
        embeds: [
            {
                title: message ? "Message Flagged" : "User Reported",
                description: object instanceof Message ? object.content : `${expand(object)} was reported.`,
                color: await getColor(_.guild!),
                fields: [
                    ...(object instanceof Message ? [{ name: "Message Link", value: object.url }] : []),
                    ...(reason ? [{ name: "Reason", value: reason }] : [{ name: "No Reason Provided", value: "_ _" }]),
                ],
                author:
                    object instanceof Message
                        ? { name: object.author.tag, icon_url: object.author.displayAvatarURL({ size: 256 }) }
                        : { name: object.tag, icon_url: object.displayAvatarURL({ size: 256 }) },
                footer: {
                    text: settings.anonymous
                        ? "Reporter hidden. Moderators can use the button below to view the reporter."
                        : `Reported by ${_.user.tag} (${_.user.id}).`,
                },
            },
        ],
        components: settings.anonymous
            ? [
                  {
                      type: ComponentType.ActionRow,
                      components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: "::reports/view", label: "View Reporter" }],
                  },
              ]
            : [],
        allowedMentions: { parse: ["roles"] },
    });

    if (settings.anonymous) await db.reporters.insertOne({ message: post.id, user: _.user.id });
    await modal.editReply(template.success("Your report was submitted and will be reviewed soon."));
}
