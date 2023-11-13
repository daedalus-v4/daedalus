import Argentium from "argentium";
import { Events } from "discord.js";
import { db } from "shared/db.js";
import { skip } from "../utils.js";

export default (app: Argentium) =>
    app
        .on(Events.GuildMemberRemove, async (member) => {
            if (await skip(member.guild, "sticky-roles")) return;

            await db.stickyRoles.updateOne(
                { guild: member.guild.id, user: member.id },
                { $set: { roles: member.roles.cache.filter((role) => !role.managed && role.id !== member.guild.roles.everyone.id).map((role) => role.id) } },
                { upsert: true },
            );
        })
        .on(Events.GuildMemberAdd, async (member) => {
            if (await skip(member.guild, "sticky-roles")) return;

            let { roles } = (await db.stickyRoles.findOne({ guild: member.guild.id, user: member.id })) ?? {};
            if (!roles?.length) return;

            const { exclude } = (await db.stickyRolesSettings.findOne({ guild: member.guild.id })) ?? {};
            if (exclude) roles = roles.filter((role) => !exclude.includes(role) && member.guild.members.me!.roles.highest.comparePositionTo(role) > 0);

            if (roles.length > 0) await member.roles.add(roles, "re-adding roles to returning member");
        });
