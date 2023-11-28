import { MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { db } from "shared/db.js";
import { parseMessageURL, parseMessageURLOrNull } from "../../lib/parsing.js";

export default async function (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, added: boolean) {
    if (!reaction.message.guild || user.bot) return;

    const doc = await db.reactionRolesSettings.findOne({ guild: reaction.message.guild.id });
    if (!doc) return;

    const entry = doc.entries.find((x) =>
        x.addReactionsToExistingMessage
            ? JSON.stringify(parseMessageURLOrNull(x.url)) === JSON.stringify(parseMessageURL(reaction.message.url))
            : x.style === "reactions" && x.message === reaction.message.id,
    );

    if (!entry || entry.error) return;

    const roles = entry.reactionData.map((x) => x.role!);
    const add = entry.reactionData.find((x) => x.emoji === (reaction.emoji.id ?? reaction.emoji.toString()))?.role;
    if (!add) return;

    const remove = roles.filter((x) => x !== add);
    const member = await reaction.message.guild.members.fetch(user.id);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles)) {
            if (!member.roles.cache.has(add)) await reaction.users.remove(user.id);
            return;
        }
        if (added) await member.roles.add(add);
    } else if (entry.type === "normal" || entry.type === "unique") {
        if (member.roles.cache.has(add)) {
            if (!added) {
                await member.roles.remove(add);
                await reaction.users.remove(user.id);
            }
        } else if (added)
            if (entry.type === "normal") await member.roles.add(add);
            else {
                await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), add])]);

                const message = await reaction.message.fetch();

                for (const r of message.reactions.cache.values()) {
                    if ((r.emoji.id ?? r.emoji.toString()) === (reaction.emoji.id ?? reaction.emoji.toString())) continue;
                    await r.users.remove(user.id);
                }
            }
    } else {
        if (added) {
            if (!member.roles.cache.has(add)) await member.roles.add(add);
            await reaction.users.remove(user.id);
        }
    }
}
