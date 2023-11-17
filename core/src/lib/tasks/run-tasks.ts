import { Client } from "discord.js";
import { ObjectId } from "mongodb";
import { db, isModuleEnabled } from "shared/db.js";
import getMuteRole from "../../bot/lib/get-mute-role.js";
import { close } from "../../bot/modules/modmail/lib.js";
import cycle from "../cycle.js";
import { log } from "../log.js";
import { getClient, getToken } from "../premium.js";

cycle(
    async () => {
        const ids: ObjectId[] = [];

        for await (const task of db.tasks.find({ time: { $lt: Date.now() } })) {
            let client: Client | undefined;
            let keep = false;

            try {
                client = await getClient(task.guild);
                const guild = await client.guilds.fetch(task.guild);

                if (task.action === "unban") await guild.bans.remove(task.user, "ban expired");
                else if (task.action === "unmute") {
                    const member = await guild.members.fetch(task.user).catch(() => {});
                    const role = await getMuteRole(guild);

                    if (role) {
                        if (member) await member.roles.remove(role).catch(() => {});
                        else if (await isModuleEnabled(task.guild, "sticky-roles"))
                            await db.stickyRoles.updateOne({ guild: task.guild, user: task.user }, { $pull: { roles: role.id } });
                    }
                } else if (task.action === "modmail/close") {
                    const channel = await guild.channels.fetch(task.channel);
                    if (channel?.isTextBased()) await close(channel, task.author, task.notify, task.message);
                }
            } catch (error) {
                if (client?.token !== (await getToken(task.guild))) {
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
