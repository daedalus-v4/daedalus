import { Client } from "discord.js";
import { ObjectId } from "mongodb";
import { databaseIsReady, db, getColor, isModuleEnabled } from "shared/db.js";
import getMuteRole from "../../bot/lib/get-mute-role.js";
import { close } from "../../bot/modules/modmail/lib.js";
import cycle from "../cycle.js";
import { log } from "../log.js";
import { getClient, getToken } from "../premium.js";

cycle(
    async () => {
        if (!databaseIsReady) return;

        const ids: ObjectId[] = [];

        for await (const task of db.tasks.find({ time: { $lt: Date.now() } })) {
            let client: Client | undefined;
            let keep = false;

            try {
                client = await getClient(task.guild ?? undefined);
                const guild = task.guild === null ? null : await client.guilds.fetch(task.guild);

                if (task.action === "unban") await guild!.bans.remove(task.user, "ban expired");
                else if (task.action === "unmute") {
                    const member = await guild!.members.fetch(task.user).catch(() => {});
                    const role = await getMuteRole(guild!);

                    if (role) {
                        if (member) await member.roles.remove(role).catch(() => {});
                        else if (await isModuleEnabled(task.guild!, "sticky-roles"))
                            await db.stickyRoles.updateOne({ guild: task.guild!, user: task.user }, { $pull: { roles: role.id } });
                    }
                } else if (task.action === "modmail/close") {
                    const channel = await guild!.channels.fetch(task.channel);
                    if (channel?.isTextBased()) await close(channel, task.author, task.notify, task.message);
                } else if (task.action === "remind") {
                    const user = await client.users.fetch(task.user).catch(() => {});
                    if (!user) continue;

                    await user
                        .send({
                            embeds: [
                                {
                                    title: `Reminder #${task.id}`,
                                    description: `You asked to be reminded [here](${task.origin})${task.query ? `: ${task.query}` : ""}`,
                                    color: task.guild ? await getColor(task.guild) : 0x009688,
                                },
                            ],
                        })
                        .catch(() => {});
                }
            } catch (error) {
                if (task.guild && client?.token !== (await getToken(task.guild))) {
                    // in this case, it's likely that the client rolled over while the task was trying to run
                    keep = true;
                } else log.error(error, "57716dda-07e0-40bf-9ebb-6bad649ac967");
            } finally {
                if (!keep) ids.push(task._id);
            }
        }

        await db.tasks.deleteMany({ _id: { $in: ids } });
    },
    10 * 1000,
    "c3944a5e-00a8-495c-9c73-fad1168071e3",
    false,
);
