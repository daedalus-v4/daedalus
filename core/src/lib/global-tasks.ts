import { Client } from "discord.js";
import { ObjectId } from "mongodb";
import { DbXpAmounts } from "shared";
import { db, isModuleEnabled } from "shared/db.js";
import getMuteRole from "../bot/lib/get-mute-role.js";
import cycle from "./cycle.js";
import { log } from "./log.js";
import { getClient, getToken } from "./premium.js";

cycle(
    async () => {
        const now = new Date();
        const { lastXpPurge } = (await db.globals.findOneAndUpdate({}, { $set: { lastXpPurge: now.getTime() } }, { upsert: true })) ?? { lastXpPurge: 0 };

        const last = new Date(lastXpPurge);

        const $set: Partial<DbXpAmounts> = {};

        if (now.getDate() !== last.getDate()) $set.daily = { text: 0, voice: 0 };

        if (Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)) !== Math.floor(last.getTime() / (7 * 24 * 60 * 60 * 1000)))
            $set.weekly = { text: 0, voice: 0 };

        if (now.getMonth() !== last.getMonth()) $set.monthly = { text: 0, voice: 0 };
    },
    24 * 60 * 60 * 1000,
    "ec76ff0f-0c71-4def-a255-b08b4a0b8f43",
);

cycle(
    async () => {
        const ids: ObjectId[] = [];

        for await (const task of db.tasks.find()) {
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
