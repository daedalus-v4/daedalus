import { Channel, Guild, GuildMember, User } from "discord.js";
import { DbXpSettings } from "shared";
import { db, getColor, getLimitFor, getPremiumBenefitsFor } from "shared/db.js";
import { log } from "../../../lib/log.js";
import { mdash, template } from "../../lib/format.js";
import { invokeLog } from "../../lib/logging.js";
import { to } from "../logging/utils.js";
import { fetchAndSendMessage } from "../utils.js";

export async function isChannelBlocked(channel: Channel, settings: DbXpSettings | null) {
    if (channel.isDMBased()) return true;
    if (settings === null) return false;

    let current: Channel | null = channel;

    do {
        if (settings.blockedChannels.includes(current.id)) return true;
    } while ((current = current.parent));

    return false;
}

export async function isUserBlocked(member: GuildMember | null, settings: DbXpSettings | null) {
    if (member === null || settings === null) return false;
    return member.roles.cache.hasAny(...settings.blockedRoles);
}

export function levelToXp(level: number) {
    return (5 / 3) * level ** 3 + (135 / 6) * level ** 2 + (455 * level) / 6;
}

export function xpToLevel(xp: number, floor = true) {
    if (xp === 0) return 0;

    const u = Math.cbrt(Math.sqrt(11664 * xp ** 2 + 874800 * xp - 621075) - 108 * xp - 4050);
    const level = -u / 2 / Math.cbrt(45) - (61 * Math.cbrt(5 / 3)) / 2 / u - 9 / 2;
    return floor ? Math.floor(level) : level;
}

async function scale(channel: Channel, settings: DbXpSettings | null) {
    if (channel.isDMBased()) return 0;
    if (settings === null) return 1;

    const channels = settings.bonusChannels.slice(0, await getLimitFor(channel.guild, "xpBonusChannelCount"));

    let current: Channel | null = channel;

    do {
        const item = settings.bonusChannels.find((x) => x.channel === current!.id);
        if (item && item.multiplier !== null) return item.multiplier;
    } while ((current = current.parent));

    return 1;
}

export async function addXp(channel: Channel, member: GuildMember, text = 0, voice = 0, settings?: DbXpSettings | null) {
    text *= Math.random() * 10 + 15;
    voice *= Math.random() * 10 + 15;

    try {
        settings ??= await db.xpSettings.findOne({ guild: member.guild.id });

        const channelRatio = await scale(channel, settings);
        text *= channelRatio;
        voice *= channelRatio;

        const roleRatio = settings
            ? settings.bonusRoles
                  .slice(0, await getLimitFor(member.guild, "xpBonusRoleCount"))
                  .filter((x) => x.role && member.roles.cache.has(x.role))
                  .map((x) => x.multiplier)
                  .filter((x) => x !== null)
                  .reduce((x, y) => Math.max(x!, y!), 1)!
            : 1;

        text *= roleRatio;
        voice *= roleRatio;

        const announcement = settings?.announceLevelUp ? (settings.announceInChannel ? channel.id : settings.announceChannel) : null;

        if ((settings?.rewards.length ?? 0) > 0 || announcement) {
            const { total: before } = (await db.xpAmounts.findOne({ guild: member.guild.id, user: member.id })) ?? {};
            const levelBefore = { text: xpToLevel(before?.text ?? 0), voice: xpToLevel(before?.voice ?? 0) };
            const levelAfter = { text: xpToLevel((before?.text ?? 0) + text), voice: xpToLevel((before?.voice ?? 0) + voice) };

            for (const key of ["text", "voice"] as const) {
                if (levelAfter[key] > levelBefore[key] && announcement)
                    await fetchAndSendMessage(
                        member.guild,
                        announcement,
                        "XP",
                        "announcement",
                        {
                            content: `${member} Congratulations ${mdash} you have leveled up from ${key} level ${levelBefore[key]} to ${levelAfter[key]}!`,
                            embeds: [
                                {
                                    description: `You've leveled up from ${key} level ${levelBefore[key]} to ${levelAfter[key]}!`,
                                    color: await getColor(member.guild),
                                    image: { url: await drawLevelup(settings!, member, levelBefore[key], levelAfter[key]) },
                                },
                            ],
                            allowedMentions: { users: [member.id] },
                        },
                        `The XP level-up announcement for ${member} (${key} level ${levelBefore[key]} ${to} ${levelAfter[key]}) could not be sent.`,
                    );
            }

            const roles = new Set(member.roles.cache.keys());
            const removeable: string[] = [];

            let dmRole: string | undefined;
            const threshold = { text: 0, voice: 0 };

            for (const reward of settings?.rewards.slice(0, await getLimitFor(member.guild, "xpRewardCount")) ?? []) {
                if (reward.role === null) continue;

                let award = false;

                for (const key of ["text", "voice"] as const)
                    if (reward[key] !== null && reward[key]! >= threshold[key] && levelAfter[key] >= reward[key]!) {
                        award = true;
                        threshold[key] = reward[key]!;
                    }

                if (!award) continue;

                roles.add(reward.role);

                while (removeable.length > 0) {
                    if (dmRole === removeable[0]) dmRole = undefined;
                    roles.delete(removeable.shift()!);
                }

                if (reward.removeOnHigher) removeable.push(reward.role);

                if (reward.dmOnReward && (!reward.text || levelBefore.text < reward.text) && (!reward.voice || levelBefore.voice < reward.voice))
                    dmRole = reward.role;
            }

            try {
                await member.roles.set([...roles]);
            } catch (error) {
                log.error(error, "69d62b74-f663-43ef-9e54-ba04994ede08");

                invokeLog("botError", member.guild, () =>
                    template.logerror("Rewarding XP Roles", `One or more of the following could not be set: ${[...roles].map((x) => `<@&${x}>`).join(" ")}`),
                );
            }

            if (dmRole)
                await member
                    .send({
                        embeds: [
                            {
                                title: "Level Up!",
                                description: `Congratulations! You have reached ${(["text", "voice"] as const)
                                    .filter((key) => levelBefore[key] < levelAfter[key])
                                    .map((key) => `${key} level ${levelAfter[key]}`)
                                    .join(" & ")} in **${member.guild.name}**! You have been rewarded the **${
                                    member.guild.roles.cache.get(dmRole)?.name ?? "(Unknown Role)"
                                }** role.`,
                                color: await getColor(member.guild),
                                thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
                                image: ((url) => (url ? { url } : undefined))(member.guild.bannerURL({ size: 1024 })),
                            },
                        ],
                    })
                    .catch(() => {});
        }
    } catch (error) {
        log.error(error, "bb42a600-c7cd-4a34-88ef-794e03b8c712");
    }

    await db.xpAmounts.updateOne(
        { guild: member.guild.id, user: member.id },
        {
            $inc: {
                "daily.text": text,
                "daily.voice": voice,
                "weekly.text": text,
                "weekly.voice": voice,
                "monthly.text": text,
                "monthly.voice": voice,
                "total.text": text,
                "total.voice": voice,
            },
        },
        { upsert: true },
    );
}

async function drawLevelup(settings: DbXpSettings, member: GuildMember, before: number, after: number) {
    const benefits = await getPremiumBenefitsFor(member.guild.id);

    return `${Bun.env.RENDERER}/draw-levelup?${new URLSearchParams({
        data: JSON.stringify({
            before,
            after,
            url: benefits.customizeXpBackgrounds ? settings.announcementBackground : null,
            avatar: member.displayAvatarURL({ extension: "png" }),
        }),
    })}`;
}

export async function drawRankcard(guild: Guild, user: User, settings?: DbXpSettings | null) {
    const benefits = await getPremiumBenefitsFor(guild.id);

    const member = await guild.members.fetch(user.id).catch(() => {});
    const name = member ? member.displayName : user.displayName;

    const xp: { text: number; voice: number } = (await db.xpAmounts.findOne({ guild: guild.id, user: user.id }))?.total ?? { text: 0, voice: 0 };

    const rank = { text: 1, voice: 1 };

    for (const key of ["text", "voice"] as const) rank[key] += await db.xpAmounts.countDocuments({ guild: guild.id, [`total.${key}`]: { $gt: xp[key] } });

    settings ??= await db.xpSettings.findOne({ guild: guild.id });

    return `${Bun.env.RENDERER}/draw-rankcard?${new URLSearchParams({
        data: JSON.stringify({
            name,
            xp: { text: 0, voice: 0 },
            rank: { text: 1, voice: 1 },
            url: benefits.customizeXpBackgrounds ? settings?.rankCardBackground ?? null : null,
            avatar: member ? member.displayAvatarURL({ extension: "png" }) : user.displayAvatarURL({ extension: "png" }),
        }),
    })}`;
}
