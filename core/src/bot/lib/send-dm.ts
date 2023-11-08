import { BaseMessageOptions, Guild, User } from "discord.js";

export const dmStatuses = {
    silent: "No DM was sent.",
    sent: "The user was DM'd.",
    failed: "The user could not be DM'd (possible reasons: the user is not in the server, the user has blocked me, the user has DMs closed).",
};

export default async function (ctx: { guild: Guild | null }, user: User, silent: boolean, message: BaseMessageOptions): Promise<string> {
    if (!ctx.guild || silent || user.bot) return dmStatuses.silent;

    try {
        await ctx.guild.members.fetch({ user: user.id, force: true });
    } catch {
        return dmStatuses.silent;
    }

    try {
        await user.send(message);
        return dmStatuses.sent;
    } catch {
        return dmStatuses.failed;
    }
}
