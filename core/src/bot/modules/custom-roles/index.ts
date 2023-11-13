import Argentium from "argentium";
import { ChatInputCommandInteraction, Colors, Events, GuildMember, PartialGuildMember } from "discord.js";
import { WithId } from "mongodb";
import { DbCustomRolesSettings } from "shared";
import { db } from "shared/db.js";
import { log } from "../../../lib/log.js";
import { template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";
import { skip } from "../utils.js";

const colorMap = Object.fromEntries(Object.entries(Colors).map(([key, color]) => [key.toLowerCase(), color]));

export default (app: Argentium) =>
    app
        .commands((x) =>
            x
                .slash((x) =>
                    x
                        .key("role set")
                        .description("set your custom role's name and color")
                        .stringOption("name", "the new name")
                        .stringOption("color", "the new color")
                        .fn(defer(true))
                        .fn(async ({ _, name, color: _color }) => {
                            const [member, settings, entry] = await get(_);
                            if (!settings) throw "Custom roles have not been set up in this server.";

                            let role = entry && _.guild!.roles.cache.get(entry.role);
                            let color: number | undefined;

                            if (_color) {
                                const native = colorMap[_color];

                                if (native) color = native;
                                else {
                                    if (_color.startsWith("0x")) _color = _color.slice(2);
                                    else if (_color.startsWith("#")) _color = _color.slice(2);

                                    color = parseInt(_color, 16);
                                }

                                if (isNaN(color)) throw "Invalid color; expected a valid hex code or the name of a Discord color.";
                                if (color < 0 || color > 0xffffff) throw "Invalid color; hex code should be between #000000 and #FFFFFF.";
                            }

                            if (role) {
                                await role.edit({ name: name ?? undefined, color }).catch(() => {
                                    throw "An error occurred trying to edit your custom role. Make sure the bot has permission to manage it.";
                                });

                                return template.success(`Your custom role, ${role}, has been updated!`);
                            } else {
                                let anchor = settings.anchor !== null ? _.guild!.roles.cache.get(settings.anchor) : null;
                                if (anchor && anchor.comparePositionTo(_.guild!.members.me!.roles.highest) > 0) anchor = null;

                                try {
                                    role = await _.guild!.roles.create({ position: anchor?.position, name: name || "new role", color });

                                    await db.customRoles.updateOne({ guild: _.guild!.id, user: member.id }, { $set: { role: role.id } }, { upsert: true });

                                    await member.roles.add(role);
                                    return template.success(`Your custom role, <@&${role.id}>, has been created!`);
                                } catch (error) {
                                    log.error(error, "b5d69eba-073c-4333-a3dd-1548a0122fb8");
                                    throw "An error occurred trying to create your custom role.";
                                }
                            }
                        }),
                )
                .slash((x) =>
                    x
                        .key("role delete")
                        .description("delete your custom role")
                        .fn(defer(true))
                        .fn(async ({ _ }) => {
                            const [member, , entry] = await get(_);
                            if (!entry) throw "You do not have a custom role.";

                            const role = await _.guild!.roles.fetch(entry.role);

                            if (!role) {
                                await db.customRoles.deleteOne({ _id: entry._id });
                                return template.info("Your custom role appears to already be gone.");
                            }

                            try {
                                await role.delete();
                                await db.customRoles.deleteOne({ _id: entry._id });
                                return template.success("Your custom role has been deleted.");
                            } catch {
                                throw `An error occurred trying to delete your custom role (${role}). Make sure the bot has permission to manage it.`;
                            }
                        }),
                ),
        )
        .on(Events.GuildMemberRemove, async (member) => {
            if (await skip(member.guild, "custom-roles")) return;
            await deleteRole(member);
        })
        .on(Events.GuildMemberUpdate, async (_, member) => {
            if (await skip(member.guild, "custom-roles")) return;
            if (!(await isSupporter(member))) await deleteRole(member);
        });

async function get(
    cmd: ChatInputCommandInteraction,
): Promise<[GuildMember, DbCustomRolesSettings | null, WithId<{ guild: string; user: string; role: string }> | null]> {
    const member = await cmd.guild!.members.fetch(cmd.user);
    const settings = await db.customRolesSettings.findOne({ guild: cmd.guild!.id });
    if (!(await isSupporter(member, settings))) throw "You do not have access to custom roles.";

    const entry = await db.customRoles.findOne({ guild: member.guild.id, user: member.id });
    return [member, settings, entry];
}

async function isSupporter(member: GuildMember | PartialGuildMember, settings?: DbCustomRolesSettings | null) {
    settings ??= await db.customRolesSettings.findOne({ guild: member.guild.id });
    return !!settings && ((settings.allowBoosters && !!member.premiumSince) || member.roles.cache.hasAny(...settings.allowedRoles));
}

async function deleteRole(member: GuildMember | PartialGuildMember) {
    const entry = await db.customRoles.findOneAndDelete({ guild: member.guild.id, user: member.id });
    if (!entry) return;

    const role = member.guild.roles.cache.get(entry.role);
    await role?.delete("auto-deleting custom role").catch(() => {});
}
