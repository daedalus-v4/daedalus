import Argentium from "argentium";
import { APIEmbed, ButtonStyle, ChannelType, ComponentType, EmbedData, Role, SnowflakeUtil, escapeMarkdown } from "discord.js";
import { formatDuration, permissions } from "shared";
import { db, getColor } from "shared/db.js";
import { hex } from "wcag-contrast";
import { getClient } from "../../../lib/premium.js";
import { expand, template, timeinfo, timestamp } from "../../lib/format.js";
import { defer, fetchCaller } from "../../lib/hooks.js";
import { check } from "../../lib/permissions.js";
import { archiveDurations } from "../logging/utils.js";
import { channelBreakdown, convert, ensureCanManageRole, guildInfo } from "./lib.js";

export default (app: Argentium) =>
    app.allowInDms("avatar", "code", "convert", "help", "info", "qr", "snowflake", "Extract IDs").commands((x) =>
        x
            .slash((x) =>
                x
                    .key("avatar")
                    .description("get a user's server avatar (if present) and user avatar")
                    .userOption("user", "the user", { required: true })
                    .fn(async ({ _, user }) => {
                        const embeds: EmbedData[] = [];

                        let url: string | undefined | null;

                        if (_.guild) {
                            const member = await _.guild.members.fetch(user).catch(() => {});

                            if ((url = member?.avatarURL({ size: 4096 })))
                                embeds.push({ title: "Server Profile Avatar", color: member!.displayColor, url, image: { url } });
                        }

                        if ((url = user.avatarURL({ size: 4096 })))
                            embeds.push({ title: "User Profile Avatar", color: user.accentColor ?? 0x009688, url, image: { url } });
                        else {
                            url = user.displayAvatarURL({ size: 4096 });

                            embeds.push({
                                title: "No Profile Picture",
                                description: "The user does not have a server or user profile picture and are using their default Discord icon.",
                                color: user.accentColor ?? 0x009688,
                                url,
                                thumbnail: { url },
                            });
                        }

                        return { embeds };
                    }),
            )
            .slash((x) =>
                x
                    .key("code")
                    .description("display a Genshin Impact gift code in a convenient format")
                    .stringOption("code", "the code", { required: true })
                    .fn(({ code }) => ({
                        content: code,
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        style: ButtonStyle.Link,
                                        url: `https://genshin.hoyoverse.com/gift?code=${encodeURIComponent(code)}`,
                                        label: "Redeem",
                                    },
                                ],
                            },
                        ],
                    })),
            )
            .slash((x) =>
                x
                    .key("convert")
                    .description("convert between units or currencies")
                    .numberOption("amount", "the amount of the unit / currency", { required: true, float: true })
                    .stringOption("source", "the source unit / currency", { required: true })
                    .stringOption("target", "the target unit / currency", { required: true })
                    .fn(async ({ _, amount, source, target }) => await convert(_.guild, amount, source.toUpperCase(), target.toUpperCase())),
            )
            .slash((x) =>
                x
                    .key("help")
                    .description("get help for the bot")
                    .fn(async ({ _ }) => ({
                        content:
                            "If you are seeing blank messages from this bot, go to **User Settings > Text & Images** and enable **Embeds and Link Previews**.",
                        embeds: [
                            {
                                title: "Daedalus Help",
                                description: `Welcome to the Daedalus help page. For more information and guides, check out the [documentation](${
                                    Bun.env.DOMAIN
                                }/docs) on our dashboard, including a full [module and command list](${Bun.env.DOMAIN}/docs/modules-commands).\n\n[Dashboard](${
                                    Bun.env.DOMAIN
                                })\n${
                                    _.guild ? `[Dashboard for this server](${Bun.env.DOMAIN}/manage/${_.guild.id})\n` : ""
                                }[Invite Link (regular)](https://discord.com/api/oauth2/authorize?client_id=${
                                    (await getClient()).user?.id
                                }&permissions=1428010036470&scope=applications.commands+bot)\n[Invite Link (admin)](https://discord.com/api/oauth2/authorize?client_id=${
                                    (await getClient()).user?.id
                                }&permissions=8&scope=applications.commands+bot)\n[Support Server](https://discord.gg/7TRKfSK7EU)`,
                                color: _.guild ? await getColor(_.guild) : 0x009688,
                            },
                        ],
                        ephemeral: !!_.guild,
                    })),
            )
            .slash((x) =>
                x
                    .key("info user")
                    .description("get info on a user")
                    .userOption("user", "the user", { required: true })
                    .fn(async ({ _, user }) => {
                        const member = await _.guild?.members.fetch(user).catch(() => {});
                        const customId = member && (await db.customRoles.findOne({ guild: _.guild!.id, user: user.id }))?.role;
                        const custom = customId && _.guild!.roles.cache.get(customId);

                        if (member)
                            return {
                                embeds: [
                                    {
                                        title: `Member info for ${user.tag}`,
                                        description: user.bot ? "**This user is a bot.**" : "",
                                        color: member.displayColor,
                                        thumbnail: {
                                            url: member.displayAvatarURL({ size: 256 }),
                                        },
                                        fields: [
                                            { name: "ID", value: `\`${member.id}\`` },
                                            {
                                                name: "Creation Date",
                                                value: timeinfo(user.createdAt),
                                            },
                                            {
                                                name: "Join Date",
                                                value: timeinfo(member.joinedAt),
                                            },
                                            {
                                                name: "Display Color",
                                                value: `\`${member.displayHexColor}\``,
                                            },
                                            ...(member.premiumSince
                                                ? [
                                                      {
                                                          name: "Boosting Since",
                                                          value: timeinfo(member.premiumSince),
                                                      },
                                                  ]
                                                : []),
                                            ...(custom
                                                ? [
                                                      {
                                                          name: "Custom Role",
                                                          value: custom.toString(),
                                                      },
                                                  ]
                                                : []),
                                            {
                                                name: "Roles",
                                                value: member.roles.cache.toJSON().reverse().slice(1).join(", ") || "(none)",
                                            },
                                            {
                                                name: "Permissions",
                                                value:
                                                    member.permissions
                                                        .toArray()
                                                        .map((x) => permissions[x]?.name.replaceAll(/<\/?code>/g, ""))
                                                        .filter((x) => x)
                                                        .join(", ") || "(none)",
                                            },
                                            ...(user.flags?.toArray().length
                                                ? [
                                                      {
                                                          name: "User Flags",
                                                          value: user.flags.toArray().join(", "),
                                                      },
                                                  ]
                                                : []),
                                        ],
                                    },
                                ],
                            };
                        else
                            return {
                                embeds: [
                                    {
                                        title: `User info for ${user.tag}`,
                                        description: user.bot ? "**This user is a bot.**" : "",
                                        color: user.accentColor,
                                        thumbnail: {
                                            url: user.displayAvatarURL({ size: 256 }),
                                        },
                                        fields: [
                                            { name: "ID", value: `\`${user.id}\`` },
                                            {
                                                name: "Created At",
                                                value: timeinfo(user.createdAt),
                                            },
                                            ...(!_.guild || (await check(_.user, "history", _.channel!))
                                                ? []
                                                : [
                                                      {
                                                          name: "Ban Status",
                                                          value: await (async () => {
                                                              try {
                                                                  await _.guild!.bans.fetch(user);
                                                                  return "This user is banned from this server.";
                                                              } catch {
                                                                  return "This user is not banned from this server.";
                                                              }
                                                          })(),
                                                      },
                                                  ]),
                                            ...(user.flags?.toArray().length
                                                ? [
                                                      {
                                                          name: "User Flags",
                                                          value: user.flags.toArray().join(", "),
                                                      },
                                                  ]
                                                : []),
                                        ],
                                    },
                                ],
                            };
                    }),
            )
            .slash((x) =>
                x
                    .key("info role")
                    .description("get info on a role")
                    .roleOption("role", "the role", { required: true })
                    .fn(async (t) => ({ ...t, role: (await t._.guild!.roles.fetch(t.role.id))! }))
                    .fn(async ({ _, role }) => ({
                        embeds: [
                            {
                                title: `Role info for ${role.name}`,
                                color: role.color,
                                thumbnail: { url: role.iconURL({ size: 256 }) },
                                fields: [
                                    { name: "ID", value: `\`${role.id}\`` },
                                    {
                                        name: "Created At",
                                        value: timeinfo(role.createdAt),
                                    },
                                    {
                                        name: "Display Color",
                                        value: role.hexColor,
                                        inline: true,
                                    },
                                    {
                                        name: "Members",
                                        value: role.members.size.toString(),
                                        inline: true,
                                    },
                                    {
                                        name: "Position",
                                        value: role.position.toString(),
                                        inline: true,
                                    },
                                    {
                                        name: "Hoist",
                                        value: `Members with this role are ${role.hoist ? "" : "not "}displayed separately on the member list.`,
                                    },
                                    {
                                        name: "Mentionable",
                                        value: `This role is ${role.mentionable ? "" : "not "}mentionable by everyone.`,
                                    },
                                    ...(role.tags?.botId
                                        ? [
                                              {
                                                  name: "Bot",
                                                  value: `This role is managed by <@${role.tags.botId}>`,
                                              },
                                          ]
                                        : []),
                                    ...(role.tags?.integrationId
                                        ? [
                                              {
                                                  name: "Integration",
                                                  value: `This role is managed by integration \`${role.tags.integrationId}\``,
                                              },
                                          ]
                                        : []),
                                    ...(role.tags?.premiumSubscriberRole
                                        ? [
                                              {
                                                  name: "Booster Role",
                                                  value: "This role is the server's premium subscriber / booster role.",
                                              },
                                          ]
                                        : []),
                                    {
                                        name: "Permissions",
                                        value:
                                            role.permissions
                                                .toArray()
                                                .map((x) => permissions[x]?.name.replaceAll(/<\/?code>/g, ""))
                                                .filter((x) => x)
                                                .join(", ") || "(none)",
                                    },
                                ],
                            },
                        ],
                    })),
            )
            .slash((x) =>
                x
                    .key("info channel")
                    .description("get info on a channel")
                    .channelOption("channel", "the channel", { required: true })
                    .fn(async ({ _, channel }) => {
                        if (channel.isDMBased()) throw "This command cannot be used on DM channels.";

                        const head = [
                            { name: "ID", value: `\`${channel.id}\`` },
                            { name: "Created At", value: timeinfo(channel.createdAt) },
                            ...(channel.parent ? [{ name: "Category", value: channel.parent.name }] : []),
                        ];

                        switch (channel.type) {
                            case ChannelType.GuildText:
                            case ChannelType.GuildAnnouncement:
                            case ChannelType.GuildForum:
                                return {
                                    embeds: [
                                        {
                                            title: `${channel.type === ChannelType.GuildText ? "Text" : "News"} channel info for ${channel.name}`,
                                            description: channel.topic,
                                            color: await getColor(_.guild!),
                                            fields: [
                                                ...head,
                                                { name: "Members", value: channel.members.size.toString() },
                                                channel.nsfw
                                                    ? {
                                                          name: "NSFW",
                                                          value: "This channel is NSFW. Only members aged 18+ are allowed. It is still subject to Discord's Terms of Service.",
                                                      }
                                                    : {
                                                          name: "SFW",
                                                          value: "This channel is SFW. All members are allowed. Refrain from posting explicit content.",
                                                      },
                                                { name: "Active Threads", value: (await channel.threads.fetchActive()).threads.size.toString() },
                                                { name: "Thread Auto-Archive Duration", value: archiveDurations[channel.defaultAutoArchiveDuration ?? 0] },
                                                ...(channel.rateLimitPerUser
                                                    ? [{ name: "Slowmode", value: formatDuration(channel.rateLimitPerUser * 60000) }]
                                                    : []),
                                            ],
                                        },
                                    ],
                                };
                            case ChannelType.GuildVoice:
                            case ChannelType.GuildStageVoice:
                                return {
                                    embeds: [
                                        {
                                            title: `${channel.type === ChannelType.GuildVoice ? "Voice" : "Stage"} channel info for ${channel.name}`,
                                            color: await getColor(_.guild!),
                                            fields: [
                                                ...head,
                                                { name: "Bitrate", value: channel.bitrate.toString(), inline: true },
                                                { name: "RTC Region", value: channel.rtcRegion || "auto", inline: true },
                                                { name: "User Limit", value: (channel.userLimit || "none").toString() },
                                            ],
                                        },
                                    ],
                                };
                            case ChannelType.GuildCategory:
                                return {
                                    embeds: [
                                        {
                                            title: `Category channel info for ${channel.name}`,
                                            color: await getColor(_.guild!),
                                            fields: [head[0], head[1], { name: "Channels", value: channelBreakdown(channel.children) }],
                                        },
                                    ],
                                };
                            case ChannelType.AnnouncementThread:
                            case ChannelType.PublicThread:
                            case ChannelType.PrivateThread:
                                return {
                                    embeds: [
                                        {
                                            title: `Thread channel info for ${channel.name}`,
                                            color: await getColor(_.guild!),
                                            fields: [
                                                head[0],
                                                head[1],
                                                { name: "Parent Channel", value: channel.parent!.toString() },
                                                channel.archived
                                                    ? { name: "Archived At", value: timeinfo(channel.archivedAt) }
                                                    : { name: "Auto-Archive Duration", value: archiveDurations[channel.autoArchiveDuration ?? 0] },
                                                {
                                                    name: "Members",
                                                    value: (await channel.members.fetch()).size.toString(),
                                                },
                                                ...(channel.rateLimitPerUser
                                                    ? [{ name: "Slowmode", value: formatDuration(channel.rateLimitPerUser * 60000) }]
                                                    : []),
                                            ],
                                        },
                                    ],
                                };
                            default:
                                throw "That channel type was not recognized.";
                        }
                    }),
            )
            .slash((x) =>
                x
                    .key("info server")
                    .description("get info on a server by ID (you and the bot must be in the server)")
                    .stringOption("id", "the server's ID", { minLength: 17, maxLength: 20 })
                    .fn(async ({ _, id }) => {
                        if (!_.guild && !id) throw "You must specify a server ID when using this command in DMs.";

                        const guild = id
                            ? await (await getClient(id)).guilds.fetch(id).catch(() => {
                                  throw `Could not fetch the server with ID \`${id}\`.`;
                              })
                            : _.guild!;

                        return await guildInfo(guild);
                    }),
            )
            .slash((x) =>
                x
                    .key("info invite")
                    .description("get info on an invite and its server")
                    .stringOption("invite", "the invite link", { required: true })
                    .fn(async ({ _, invite: _invite }) => {
                        const invite = await _.client.fetchInvite(_invite).catch(() => {
                            throw "That invite could not be fetched; double-check that it is valid.";
                        });

                        if (!invite.guild) throw "This command can only be used on invites that point to servers.";

                        const embeds: APIEmbed[] = [
                            {
                                title: `Invite info for discord.gg/${invite.code}`,
                                description: `${expand(invite.inviter, "Unknown User")} invited you to join **${escapeMarkdown(invite.guild.name)}** (\`${
                                    invite.guild.id
                                })\``,
                                color: await getColor(invite.guild.id),
                                image: ((url) => (url ? { url } : undefined))(invite.guild.bannerURL({ size: 4096 })),
                                footer: {
                                    text: `${invite.guild.name} (${invite.guild.id})`,
                                    icon_url: invite.guild.iconURL({ size: 64 }) || undefined,
                                },
                                thumbnail: ((url) => (url ? { url } : undefined))(invite.guild.iconURL({ size: 256 })),
                                fields: [
                                    {
                                        name: "Destination",
                                        value: `${invite.channel} in **${escapeMarkdown(invite.guild.name)}** (\`${invite.guild.id}\`)`,
                                    },
                                    {
                                        name: "Expiration",
                                        value: invite.expiresAt ? timeinfo(invite.expiresAt) : "This invite does not expire.",
                                    },
                                    ...(invite.guildScheduledEvent
                                        ? [
                                              {
                                                  name: "Event",
                                                  value: `This invite points to an event named **${escapeMarkdown(
                                                      invite.guildScheduledEvent.name,
                                                  )}** scheduled to ${
                                                      invite.guildScheduledEvent.scheduledEndAt
                                                          ? `run from ${timeinfo(invite.guildScheduledEvent.scheduledStartAt)} to ${timeinfo(
                                                                invite.guildScheduledEvent.scheduledEndAt,
                                                            )}`
                                                          : `start at ${timeinfo(invite.guildScheduledEvent.scheduledStartAt)}`
                                                  }.`,
                                              },
                                          ]
                                        : []),
                                    ...(invite.targetUser
                                        ? [
                                              {
                                                  name: "Target Stream",
                                                  value: `This invite will bring you to ${expand(invite.targetUser)}'s stream.`,
                                              },
                                          ]
                                        : []),
                                ],
                            },
                        ];

                        const guild = await (await getClient(invite.guild.id)).guilds.fetch(invite.guild.id).catch(() => {});
                        if (guild?.members.cache.has(_.user.id)) embeds.push((await guildInfo(guild)).embeds[0]);

                        return { embeds };
                    }),
            )
            .slash((x) =>
                x
                    .key("qr")
                    .description("encode text as a QR code")
                    .stringOption("text", "the text", { maxLength: 1000, required: true })
                    .fn(async ({ _, text }) => {
                        const encoded = `https://api.qrserver.com/v1/create-qr-code?size=120x120&data=${encodeURIComponent(text)}`;

                        return {
                            embeds: [
                                {
                                    title: "**QR Code**",
                                    desscription: encoded,
                                    color: _.guild ? await getColor(_.guild) : 0x009688,
                                    image: { url: encoded },
                                    fields: [{ name: "Original Text", value: text }],
                                },
                            ],
                        };
                    }),
            )
            .slash((x) =>
                x
                    .key("roles add")
                    .description("add a role to a user")
                    .userOption("member", "the member to which to add a role", { required: true })
                    .roleOption("role", "the role to add", { required: true })
                    .fn(fetchCaller)
                    .fn(ensureCanManageRole)
                    .fn(async ({ _, member, role }) => {
                        await member.roles.add(role, `added by ${_.user.tag} (${_.user.id})`);
                        return template.success(`Added ${role} to ${member}.`);
                    }),
            )
            .slash((x) =>
                x
                    .key("roles remove")
                    .description("remove a role from a user")
                    .userOption("member", "the member from which to remove a role", { required: true })
                    .roleOption("role", "the role to remove", { required: true })
                    .fn(fetchCaller)
                    .fn(ensureCanManageRole)
                    .fn(async ({ _, member, role }) => {
                        await member.roles.remove(role, `removed by ${_.user.tag} (${_.user.id})`);
                        return template.success(`Removed ${role} to ${member}.`);
                    }),
            )
            .slash((x) =>
                x
                    .key("snowflake")
                    .description("output deconstructed snowflake data (any Discord ID is a snowflake)")
                    .stringOption("snowflake", "the snowflake", { required: true, minLength: 17, maxLength: 20 })
                    .fn(async ({ _, snowflake: _snowflake }) => {
                        const match = _snowflake.match(/^((\d+)|<(@&?|#)(\d+)>|<a?:[^:]+:(\d+):>)$/);

                        if (!match) throw "The expected format is a snowflake (a string of digits), a user/role/channel mention, or an emoji.";

                        const snowflake = match[5] ?? match[4] ?? match[0];

                        const data = SnowflakeUtil.deconstruct(snowflake);
                        const time = Number(data.timestamp);

                        return {
                            embeds: [
                                {
                                    title: "**Snowflake Data**",
                                    description: `\`${snowflake}\``,
                                    color: _.guild ? await getColor(_.guild) : 0x009688,
                                    fields: [
                                        { name: "Timestamp", value: `${timestamp(time, "R")} (${timestamp(time, "F")}) - \`${time}\`` },
                                        { name: "Worker ID", value: `\`${data.workerId}\`` },
                                        { name: "Process ID", value: `\`${data.processId}\`` },
                                        { name: "Increment", value: `\`${data.increment}\`` },
                                    ],
                                },
                            ],
                            ephemeral: false,
                        };
                    }),
            )
            .slash((x) =>
                x
                    .key("role-accessibility")
                    .description("check the contrast of roles' colors")
                    .numberOption("threshold", "the required contrast value (default: 3.0)", { minimum: 0 })
                    .fn(defer(false))
                    .fn(async ({ _, threshold }) => {
                        threshold ??= 3;

                        const problems: [Role, boolean, number][] = [];

                        for (const role of _.guild!.roles.cache.values()) {
                            if (role.color === 0) continue;

                            const lc = Math.round(hex("#ffffff", role.hexColor) * 100) / 100;
                            const dc = Math.round(hex("#323338", role.hexColor) * 100) / 100;

                            if (lc < threshold) problems.push([role, true, lc]);
                            if (dc < threshold) problems.push([role, false, dc]);
                        }

                        if (problems.length === 0) return template.success("All of this server's roles meet accessibility standards!");

                        const rows = problems.map(([role, light, value]) => `- ${role} is too ${light ? "bright" : "dark"} (contrast = ${value})`);

                        const blocks = [rows.shift()!];

                        while (rows.length > 0) {
                            if (blocks.at(-1)!.length + 1 + rows[0].length <= 4096) blocks[blocks.length - 1] += `\n${rows.shift()}`;
                            else blocks.push(rows.shift()!);
                        }

                        const color = await getColor(_.guild!);

                        let first = true;

                        for (const block of blocks) {
                            const data = { embeds: [{ description: block, color, footer: { text: `The contrast should be at least ${threshold}.` } }] };

                            if (first) await _.editReply(data);
                            else await _.followUp(data);

                            first = false;
                        }
                    }),
            )
            .message((x) =>
                x.name("Extract IDs").fn(async ({ message }) => {
                    const content = message.content.match(/\b[1-9][0-9]{16,19}\b/g)?.join(" ");
                    return content ? { content, ephemeral: true } : template.error("No IDs found.");
                }),
            ),
    );
