import he from "he";
import { databaseIsReady, db, getColor, isModuleEnabled } from "shared/db.js";
import { truncate } from "../../bot/lib/format.js";
import cycle from "../cycle.js";
import { log } from "../log.js";
import { getClient } from "../premium.js";

cycle(
    async () => {
        if (!databaseIsReady) return;

        for await (const settings of db.redditFeedsSettings.find()) {
            try {
                const guild = await (await getClient(settings.guild)).guilds.fetch(settings.guild).catch(() => {});
                if (!guild) continue;
                if (!(await isModuleEnabled(guild.id, "reddit-feeds"))) continue;

                for (const feed of settings.feeds) {
                    if (!feed.channel) continue;
                    const channel = await guild.channels.fetch(feed.channel).catch(() => {});
                    if (!channel?.isTextBased()) continue;

                    const color = await getColor(guild);

                    const request = await fetch(`https://reddit.com/r/${feed.subreddit}/new/.json`, {
                        headers: { "User-Agent": "daedalus (daedalusbot.xyz)" },
                    });

                    if (!request.ok) {
                        log.error({ status: request.status }, "08bbdc35-c961-4313-9a2a-ece7b7395a6b");
                        continue;
                    }

                    const response = (await request.json()) as any;

                    const posts = response.data.children
                        .map((x: any) => x.data)
                        .filter((x: any) => !x.over_18 && x.created_utc * 1000 >= Date.now() - 60 * 1000)
                        .slice(0, 6)
                        .reverse();

                    (async () => {
                        for (const post of posts) {
                            const url = post.url.match(/\.(png|jpg)$/) ? post.url : null;
                            const title = he.decode(post.title);

                            await channel
                                .send({
                                    embeds: [
                                        {
                                            title: truncate(title, 256),
                                            description: truncate(post.selftext, 4096),
                                            color,
                                            image: url ? { url } : undefined,
                                            url: `https://reddit.com${post.permalink}`,
                                            footer: { text: `Posted by u/${post.author} in ${post.subreddit_name_prefixed}` },
                                        },
                                    ],
                                })
                                .catch((e) => log.error(e, "7d810306-0878-4850-bb82-3c0fa6c7d022"));

                            await new Promise((r) => setTimeout(r, (60 * 1000) / posts.length));
                        }
                    })();
                }
            } catch (error) {
                log.error(error, "2cb98fc2-48f6-4d3d-a974-875ce943a25e");
            }
        }
    },
    60 * 1000,
    "5d0fd379-e936-47b4-9c77-1ca96288a155",
);
