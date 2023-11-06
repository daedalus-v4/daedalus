import { APIInteractionGuildMember, Channel, Client, Guild, GuildMember, PermissionFlagsBits, User } from "discord.js";
import { commandMap, modules, permissions } from "shared";
import { db } from "shared/db.js";
import { log } from "../../lib/log.js";

export async function check(user: User, name: string, channel: Channel, bypass?: boolean): Promise<string | false> {
    if (channel.isDMBased()) return false;

    const command = commandMap[name];
    const req = command?.permissions ?? [];

    const permissionsSettings = await db.modulesPermissionsSettings.findOne({ guild: channel.guild.id });

    if (!(permissionsSettings?.modules[command.module].enabled ?? modules[command.module].default ?? true))
        return `The ${modules[command.module].name} module is disabled.`;

    if (!(permissionsSettings?.commands[name].enabled ?? command.default ?? true)) return `The ${command.name} command is disabled.`;

    if (!(bypass ?? command.bypass)) {
        const required = (Array.isArray(req) ? req : [req]).filter((x) => x).map((key) => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits]);

        try {
            const member = await channel.guild.members.fetch(user);
            const roles = [...member.roles.cache.keys()];

            const guildSettings = await db.guildSettings.findOne({ guild: channel.guild.id });
            const commandSettings = permissionsSettings?.commands[name];

            if (guildSettings) {
                if (
                    channel.guild.ownerId !== user.id &&
                    (guildSettings.blockedRoles?.some((id: string) => roles.includes(id)) ||
                        (guildSettings.modOnly && !guildSettings.allowedRoles?.some((id: string) => roles.includes(id))))
                )
                    return "You are not permitted to use this bot's commands in this server.";

                let current: Channel | null = channel;
                let allowed = false;

                while (current) {
                    if (guildSettings.blockedChannels?.includes(current.id)) return "Commands are not permitted in this channel.";
                    allowed ||= guildSettings.allowedChannels?.includes(current.id);
                    current = current.parent;
                }

                if (guildSettings.allowlistOnly && !allowed) return "Commands are not permitted in this channel.";
            }

            if (
                channel.guild.ownerId !== user.id &&
                (commandSettings?.ignoreDefaultPermissions ||
                    !channel.permissionsFor(member).has(required) ||
                    commandSettings?.blockedRoles?.some((id: string) => roles.includes(id))) &&
                !commandSettings?.allowedRoles?.some((id: string) => roles.includes(id))
            )
                return "You do not have permission to use that command.";

            let current: Channel | null = channel;

            while (current) {
                if (commandSettings?.allowedChannels?.includes(current.id)) break;
                if (commandSettings?.blockedChannels?.includes(current.id)) return "This command is not permitted in this channel.";

                current = current.parent;
                if (!current && commandSettings?.restrictChannels) return "This command is not permitted in this channel.";
            }

            if (
                !channel
                    .permissionsFor(channel.guild.members.me!)
                    .has((command.selfPermissions ?? []).map((key) => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits]))
            )
                return `I am missing required permissions: ${command.selfPermissions?.map((x) => permissions[x as keyof typeof permissions].name).join(", ")}`;
        } catch (error) {
            log.error(error, "63e28a43-1e7e-4632-afe8-b33e9c98315c");
            return "An unknown error occurred trying to verify your permissions.";
        }
    }

    return false;
}

export async function check_punishment(
    ctx: { client: Client; guild: Guild; member: GuildMember | APIInteractionGuildMember },
    target: User | GuildMember,
    action: "warn" | "mute" | "timeout" | "kick" | "ban",
) {
    const member = await ctx.guild.members.fetch(ctx.member.user.id).catch(() => {
        throw "An error occurred fetching you from the guild.";
    });

    if (member.id === target.id) throw `You cannot ${action} yourself.`;

    if (member.id === ctx.client.user!.id)
        throw action === "warn"
            ? "You cannot warn the bot using its commands. If there are issues with its functionality, please report it in the Daedalus support server [here](https://discord.gg/7TRKfSK7EU)."
            : `The bot cannot ${action} itself, so if you wish to do so, do so manually.`;

    let target_member: GuildMember;

    try {
        target_member = target instanceof GuildMember ? target : await ctx.guild.members.fetch(target);
    } catch {
        return;
    }

    if (target_member.id === ctx.guild.ownerId) throw `You cannot ${action} the server owner.`;

    if (action === "timeout" && target_member.permissions.has(PermissionFlagsBits.Administrator)) throw "You cannot timeout server administrators.";

    if (ctx.guild.ownerId !== member.id) {
        const cmp = member.roles.highest.comparePositionTo(target_member.roles.highest);

        if (cmp < 0)
            throw `${target_member} is higher in role hierarchy than you, so you cannot ${action} them (${target_member.roles.highest} > ${member.roles.highest}).`;

        if (cmp === 0) throw `${target_member} is equal in role hierarchy to you, so you cannot ${action} them (highest role: ${member.roles.highest}).`;
    }

    if ((action === "ban" && !target_member.bannable) || (action === "kick" && !target_member.kickable) || (action === "timeout" && !target_member.moderatable))
        throw `${target_member} is higher than or equal to the bot in role hierarchy, so it cannot ${action} them.`;
}
