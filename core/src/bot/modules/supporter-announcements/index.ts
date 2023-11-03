import Argentium from "argentium";
import { Events } from "discord.js";
import { db, getLimitFor } from "shared/db.js";
import { fetchAndSendCustom, skip } from "../utils.js";

export default (app: Argentium) =>
    app.on(Events.GuildMemberUpdate, async (before, after) => {
        if (await skip(after.guild, "supporter-announcements")) return;
        if (Date.now() - (after.joinedTimestamp ?? 0) < 5000) return; // in case of sticky roles, don't re-announce

        const { entries } = (await db.supporterAnnouncementSettings.findOne({ guild: after.guild.id })) ?? {};
        if (!entries?.length) return;

        for (const item of entries.slice(0, await getLimitFor(after.guild, "supporterAnnouncementsCount"))) {
            if (!item.channel) continue;

            if (item.boosts ? before.premiumSince || !after.premiumSince : !item.role || before.roles.cache.has(item.role) || !after.roles.cache.has(item.role))
                continue;

            await fetchAndSendCustom(
                after.guild,
                item.channel,
                "Supporter Announcements",
                "supporter announcement",
                item.message,
                `The supporter announcement for ${after} ${item.boosts ? "boosting the server" : `gaining <@&${item.role}>`} could not be sent.`,
                () => ({ guild: after.guild, member: after, role: item.role === null ? undefined : after.guild.roles.cache.get(item.role) }),
                true,
            );
        }
    });
