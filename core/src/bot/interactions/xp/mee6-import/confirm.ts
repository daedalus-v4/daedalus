import { ButtonInteraction } from "discord.js";
import { db, getColor } from "shared/db.js";
import { colors } from "../../../lib/format.js";

const $setOnInsert = { daily: { text: 0, voice: 0 }, weekly: { text: 0, voice: 0 }, monthly: { text: 0, voice: 0 }, "total.voice": 0 };

export default async function (cmd: ButtonInteraction, mode: string) {
    await cmd.update({
        embeds: [{ title: "Importing XP from MEE6...", description: "This may take a while; please be patient.", color: colors.prompts.inProgress }],
        components: [],
    });

    const data: { id: string; xp: number }[] = [];

    for (let page = 0; ; page++) {
        const request = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/${cmd.guild!.id}?limit=1000&page=${page}`);

        if (!request.ok)
            return void (await cmd.editReply({
                embeds: [
                    {
                        title: "Error importing XP from MEE6",
                        description: "Make sure MEE6 is in your server and your leaderboard is set to public.",
                        color: colors.error,
                    },
                ],
            }));

        const list = (await request.json()).players as { id: string; detailed_xp: number[] }[];
        for (const user of list) data.push({ id: user.id, xp: user.detailed_xp[2] });

        if (list.length < 1000) break;
    }

    if (mode === "replace") {
        await db.xpAmounts.updateMany({ guild: cmd.guild!.id }, { $set: { "daily.text": 0, "weekly.text": 0, "monthly.text": 0, "total.text": 0 } });

        await db.xpAmounts.bulkWrite([
            ...data.map((item) => ({
                updateOne: { filter: { guild: cmd.guild!.id, user: item.id }, update: { $set: { "total.text": item.xp }, $setOnInsert }, upsert: true },
            })),
        ]);
    } else {
        await db.xpAmounts.bulkWrite([
            ...data.map((item) => ({
                updateOne: {
                    filter: { guild: cmd.guild!.id, user: item.id },
                    update: mode === "add" ? { $inc: { "total.text": item.xp } } : { $setOnInsert: { ...$setOnInsert, "total.text": item.xp } },
                    upsert: true,
                },
            })),
        ]);
    }

    await cmd.editReply({
        embeds: [
            {
                title: "Imported MEE6 XP",
                description:
                    "MEE6 XP has been successfully imported. Your daily/weekly/monthly leaderboards may not be accurate as incoming XP was not added to the timed leaderboards.",
                color: await getColor(cmd.guild!),
            },
        ],
    });
}
