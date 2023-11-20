import {
    APIEmbed,
    APIRole,
    BaseMessageOptions,
    CategoryChildChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    GuildBasedChannel,
    GuildMember,
    Role,
    User,
} from "discord.js";
import { databaseIsReady, db, getColor } from "shared/db.js";
import cycle from "../../../lib/cycle.js";
import { log } from "../../../lib/log.js";
import { timeinfo } from "../../lib/format.js";
import units, { Unit } from "./units.js";

const map: Record<string, Unit> = Object.fromEntries(units.flatMap((x) => x.name.map((name) => [name.toUpperCase(), x])));

let currencies: Record<string, number> = {};

async function load() {
    if (!databaseIsReady) {
        setTimeout(load, 1000);
        return;
    }

    const existing = await db.globals.findOne({});

    if (existing?.currencies) currencies = existing.currencies;
    else await refresh();
}

load();

async function refresh() {
    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${Bun.env.CURRENCY_API_KEY}`);
    if (!response.ok) return void log.error(await response.text(), "34dfe742-1e09-45cf-b4aa-87cceb4be521");

    currencies = Object.fromEntries(Object.entries(((await response.json()) as any).data).map(([k, v]: any) => [k, v.value]));
    await db.globals.updateOne({}, { $set: currencies }, { upsert: true });
}

cycle(refresh, 86400000, "a84b27ef-237c-4325-a714-1aaaf996e0ff");

export async function convert(guild: Guild | null, amount: number, source: string, target: string): Promise<BaseMessageOptions> {
    if (source in map && target in map) {
        const src = map[source];
        const dst = map[target];

        if (src.dimension !== dst.dimension)
            throw `Dimension Mismatch: \`${src.id}\` is a unit of ${src.dimension} but \`${dst.id}\` is a unit of ${dst.dimension}.`;

        return {
            embeds: [
                {
                    title: "**Conversion Result**",
                    color: guild ? await getColor(guild) : 0x009688,
                    fields: [
                        {
                            name: src.id,
                            value: `${Math.round(amount * 10000) / 10000}`,
                            inline: true,
                        },
                        {
                            name: dst.id,
                            value: `${Math.round((((amount + (src.offset ?? 0)) * src.scale) / dst.scale - (dst.offset ?? 0)) * 10000) / 10000}`,
                            inline: true,
                        },
                    ],
                    footer: { text: `units of ${src.dimension}` },
                },
            ],
        };
    }

    if (source in currencies && target in currencies) {
        return {
            embeds: [
                {
                    title: "**Currency Conversion**",
                    color: guild ? await getColor(guild) : 0x009688,
                    fields: [
                        {
                            name: source,
                            value: `${Math.round(amount * 100) / 100}`,
                            inline: true,
                        },
                        {
                            name: target,
                            value: `${Math.round((amount / currencies[source]) * currencies[target] * 100) / 100}`,
                            inline: true,
                        },
                    ],
                    footer: { text: "The conversion rates are only updated daily, so they may not be completely accurate." },
                },
            ],
        };
    }

    throw `Either \`${source}\` or \`${target}\` was not recognized. Please ensure both are common units of the same dimension or both are currencies.`;
}

export function channelBreakdown(channels: any) {
    let count = 0,
        text = 0,
        voice = 0,
        category = 0,
        news = 0,
        stage = 0,
        thread = 0,
        forum = 0;

    (Array.isArray(channels) ? channels : channels.cache).forEach((channel: CategoryChildChannel | GuildBasedChannel) => {
        count++;
        if (!channel) return;

        switch (channel.type) {
            case ChannelType.GuildText:
                text++;
                break;
            case ChannelType.GuildVoice:
                voice++;
                break;
            case ChannelType.GuildCategory:
                category++;
                break;
            case ChannelType.GuildAnnouncement:
                news++;
                break;
            case ChannelType.AnnouncementThread:
            case ChannelType.PublicThread:
            case ChannelType.PrivateThread:
                thread++;
                break;
            case ChannelType.GuildForum:
                forum++;
                break;
            case ChannelType.GuildStageVoice:
                stage++;
                break;
        }
    });

    return `${count} (${[
        text ? `${text} text` : [],
        voice ? `${voice} voice` : [],
        category ? `${category} categor${category === 1 ? "y" : "ies"}` : [],
        news ? `${news} news` : [],
        stage ? `${stage} stage` : [],
        thread ? `${thread} thread${thread === 1 ? "" : "s"}` : [],
        forum ? `${forum} forum${forum === 1 ? "" : "s"}` : [],
    ]
        .flat()
        .join(", ")})`;
}

export async function guildInfo(guild: Guild): Promise<{ embeds: APIEmbed[] }> {
    return {
        embeds: [
            {
                title: `Guild info for ${guild.name}`,
                description: guild.description || undefined,
                color: await getColor(guild),
                image: ((url) => (url ? { url } : undefined))(guild.bannerURL({ size: 4096 })),
                footer: {
                    text: guild.name,
                    icon_url: guild.iconURL({ size: 64 }) || undefined,
                },
                thumbnail: ((url) => (url ? { url } : undefined))(guild.iconURL({ size: 256 })),
                fields: [
                    { name: "ID", value: `\`${guild.id}\`` },
                    { name: "Owner", value: `<@${guild.ownerId}>` },
                    { name: "Creation Date", value: timeinfo(guild.createdAt) },
                    {
                        name: "Channels",
                        value: channelBreakdown(
                            ((await guild.channels.fetch()).toJSON() as GuildBasedChannel[]).concat(
                                (await guild.channels.fetchActiveThreads()).threads.toJSON(),
                            ),
                        ),
                    },
                    {
                        name: "Members",
                        value: guild.memberCount.toString(),
                        inline: true,
                    },
                    ...(await (async () => {
                        let count: number;

                        try {
                            count = (await guild.invites.fetch()).size;
                        } catch {
                            return [];
                        }

                        return [{ name: "Invites", value: `${count}` }];
                    })()),
                    {
                        name: "Roles",
                        value: `${(await guild.roles.fetch()).size}`,
                        inline: true,
                    },
                    {
                        name: "Boosts",
                        value: `${guild.premiumSubscriptionCount ?? 0}`,
                        inline: true,
                    },
                    ...(guild.vanityURLCode
                        ? [
                              {
                                  name: "Vanity Code",
                                  value: (({ code, uses }) => `https://discord.gg/${code} (used ${uses} times)`)(await guild.fetchVanityData()),
                              },
                          ]
                        : []),
                ],
            },
        ],
    };
}

export async function ensureCanManageRole({
    _,
    caller,
    member: _member,
    role: _role,
}: {
    _: ChatInputCommandInteraction;
    caller: GuildMember;
    member: User;
    role: Role | APIRole;
}) {
    const member = await _.guild!.members.fetch(_member).catch(() => {
        throw "That user does not appear to be in this server.";
    });

    const role = (await _.guild!.roles.fetch(_role.id))!;

    if (_.guild!.ownerId !== caller.id && role.comparePositionTo(caller.roles.highest) >= 0)
        throw "You can only manage roles that are below your highest role.";

    if (role.comparePositionTo(caller.guild.members.me!.roles.highest) >= 0) throw "The bot cannot manage this role as it is above its highest role.";

    if (role.managed) throw "You cannot manually manage system-bound roles such as bot roles and booster roles.";

    const val = { _, member, role };

    if (_.guild!.ownerId === caller.id) return val;

    const settings = await db.utilitySettings.findOne({ guild: _.guild!.id });
    if (!settings) return val;

    if (caller.roles.cache.hasAny(...settings.bypassRoles)) return val;

    if (settings.blockRolesByDefault ? !settings.allowedRoles.includes(role.id) : settings.blockedRoles.includes(role.id))
        throw `This server's Daedalus settings forbid management of ${role}.`;

    return val;
}
