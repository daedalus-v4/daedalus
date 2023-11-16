import Argentium from "argentium";
import { APIRole, AuditLogEvent, Events, Guild, GuildChannel, User } from "discord.js";
import { DbNukeguardSettings } from "shared";
import { db } from "shared/db.js";
import { getClient } from "../../../lib/premium.js";
import { colors, englishList, expand } from "../../lib/format.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
        if (!entry.executorId) return;

        const user = await (await getClient()).users.fetch(entry.executorId).catch(() => {});
        if (!user) return;

        if (user.id === guild.ownerId) return;
        if (user.id === guild.client.user.id) return;

        if (
            ![
                AuditLogEvent.ChannelDelete,
                AuditLogEvent.RoleDelete,
                AuditLogEvent.EmojiDelete,
                AuditLogEvent.StickerDelete,
                AuditLogEvent.WebhookCreate,
                AuditLogEvent.WebhookDelete,
                AuditLogEvent.MemberBanAdd,
                AuditLogEvent.MemberKick,
                AuditLogEvent.MemberRoleUpdate,
            ].includes(entry.action)
        )
            return;

        if (await skip(guild, "nukeguard")) return;

        const settings = await db.nukeguardSettings.findOne({ guild: guild.id });
        if (!settings) return;

        try {
            const member = await guild.members.fetch(user);
            if (member.roles.cache.hasAny(...settings.exemptedRoles)) return;
        } catch {
            return;
        }

        let type: string | undefined;
        let description: string;
        let alert: string;

        // TODO add soundboard deletion detection

        if (entry.action === AuditLogEvent.ChannelDelete) {
            let channel: GuildChannel | null = entry.target as GuildChannel;

            do {
                if (settings.ignoredChannels.includes(channel.id)) return;
                if (settings.watchedChannels.includes(channel.id)) break;
            } while ((channel = channel.parent));

            if (!channel && !settings.watchChannelsByDefault) return;

            type = "channel";
        } else if (entry.action === AuditLogEvent.RoleDelete) {
            if (settings.ignoredRoles.includes(entry.targetId!) || (!settings.watchRolesByDefault && !settings.watchedRoles.includes(entry.targetId!))) return;
            type = "role";
        } else if (entry.action === AuditLogEvent.EmojiDelete) {
            if (settings.ignoredEmoji.includes(entry.targetId!) || (!settings.watchEmojiByDefault && !settings.watchedEmoji.includes(entry.targetId!))) return;
            type = "emoji";
        } else if (entry.action === AuditLogEvent.StickerDelete) {
            if (settings.ignoredStickers.includes(entry.targetId!) || (!settings.watchStickersByDefault && !settings.watchedStickers.includes(entry.targetId!)))
                return;

            type = "sticker";
        } else if (entry.action === AuditLogEvent.WebhookCreate) {
            if (!settings.preventWebhookCreation) return;

            const webhooks = await guild.fetchWebhooks();
            const webhook = webhooks.find((x) => x.id === entry.targetId);
            if (!webhook) return;

            await webhook.delete("Nukeguard Action");

            await user
                .send({
                    embeds: [
                        {
                            title: "Nukeguard Warning",
                            description:
                                "Your newly created webhook was deleted by Daedalus Nukeguard. If you need a new webhook, please talk to server administration or the server owner.",
                            color: colors.actions.delete,
                        },
                    ],
                })
                .catch(() => {});

            return;
        } else if (entry.action === AuditLogEvent.WebhookDelete) {
            if (!settings.watchWebhookDeletion) return;
            description = "deleted a webhook, which is not permitted by nukeguard.";
        } else if (entry.action === AuditLogEvent.MemberBanAdd) {
            return void (await track(guild, user, settings));
        } else if (entry.action === AuditLogEvent.MemberKick) {
            if (!settings.ratelimitKicks) return;
            return void (await track(guild, user, settings));
        } else if (entry.action === AuditLogEvent.MemberRoleUpdate) {
            const roles = entry.changes
                .filter((x) => x.key === "$add")
                .flatMap((x) =>
                    (x.new as APIRole[])
                        .map((k) => k.id)
                        .filter((x) =>
                            settings.restrictRolesBlockByDefault
                                ? !settings.restrictRolesAllowedRoles.includes(x)
                                : settings.restrictRolesBlockedRoles.includes(x),
                        ),
                );

            if (roles.length === 0) return;

            const names = englishList(roles.map((x) => guild.roles.cache.get(x)?.name ?? "(unknown role)"));

            try {
                const member = await guild.members.fetch(entry.targetId!);
                await member.roles.remove(roles);
            } catch {}

            if (settings.restrictRolesLenientMode) {
                const now = Date.now();

                if (!watchlist.has(user.id) || now - watchlist.get(user.id)! > 360000) {
                    watchlist.set(user.id, now);

                    return void (await user
                        .send({
                            embeds: [
                                {
                                    title: "Nukeguard Warning",
                                    description: `You assigned roles that are forbidden by the nukeguard configuration (${names}). Violating this rule again within 1 hour will result in further actions. Speak to a server administrator of the server owner if you believe this is a mistake.`,
                                    color: colors.actions.importantUpdate,
                                },
                            ],
                        })
                        .catch(() => {}));
                }
            }

            description = `assigned roles that are forbidden by the nukeguard configuration (${names}).`;
            alert = `assigned blocked roles: ${englishList(roles.map((x) => expand(guild.roles.cache.get(x), "(unknown role)")))}`;
        }

        if (type) description ??= `deleted a protected ${type} (\`${entry.targetId}\`)`;
        alert ??= `${expand(user)} ${description!}`;

        await quarantine(guild, user, settings, `You ${description!}`, alert!);
    });

const bans = new Map<string, number[]>();
const watchlist = new Map<string, number>();

async function track(guild: Guild, user: User, settings: DbNukeguardSettings) {
    if (!settings.ratelimitEnabled) return;

    if (!bans.has(user.id)) bans.set(user.id, []);

    const now = Date.now();
    const list = bans.get(user.id)!;
    list.push(now);

    if (!settings.timeInSeconds || !settings.threshold) return;
    const amount = list.filter((x) => x > now - settings.timeInSeconds! * 1000).length;

    if (amount === settings.threshold && settings.threshold !== 2)
        return void (await user
            .send({
                embeds: [
                    {
                        title: "Nukeguard Warning",
                        description:
                            "You are approaching the mod action ratelimit threshold. Please slow down to avoid further actions. Speak to a server administrator or the server owner if you believe this is a mistake.",
                        color: colors.actions.importantUpdate,
                    },
                ],
            })
            .catch(() => {}));

    if (amount >= settings.threshold)
        await quarantine(guild, user, settings, `You have hit the nukeguard mod action ratelimit threshold.`, `${expand(user)} hit the kick/ban ratelimit.`);
}

async function quarantine(guild: Guild, user: User, settings: DbNukeguardSettings, message: string, alert: string) {
    let banned = true;

    try {
        const member = await guild.members.fetch(user);
        if (member.roles.cache.hasAny(...settings.exemptedRoles)) return;
    } catch {}

    if (guild.members.cache.get(user.id)?.bannable)
        await user
            .send({
                embeds: [
                    {
                        title: "Nukeguard Action",
                        description: `${message} You have been banned and administrators have been alerted of this action; please wait for their review.`,
                        color: colors.actions.delete,
                    },
                ],
            })
            .catch(() => {});

    await guild.bans.create(user, { reason: "Nukeguard Action" }).catch(() => (banned = false));

    const channel = settings.alertChannel === null ? null : await guild.channels.fetch(settings.alertChannel!).catch(() => {});
    if (!channel?.isTextBased()) return;

    await channel
        .send({
            content: `${settings.pingHere ? "@here " : ""}${settings.pingRoles
                .map((x) => guild.roles.cache.get(x))
                .filter((x) => x)
                .map((x) => `${x}`)
                .join(" ")}`,
            embeds: [
                {
                    title: "Nukeguard Report",
                    description: `${alert} ${banned ? "and was" : "but could not be"} quarantined (temporarily banned).`,
                    color: colors.actions.importantUpdate,
                },
            ],
            allowedMentions: { parse: ["everyone", "roles"] },
        })
        .catch(() => {});
}

setInterval(() => {
    const filter = Date.now() - 3600000;

    for (const [key, list] of bans) {
        bans.set(
            key,
            list.filter((x) => x > filter),
        );

        if (bans.get(key)!.length === 0) bans.delete(key);
    }
}, 600000);
