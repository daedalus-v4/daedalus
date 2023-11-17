import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { getClient } from "../../../lib/premium.js";
import { expand, template } from "../../lib/format.js";
import { check } from "../../lib/permissions.js";

export default async function (button: ButtonInteraction) {
    await check(button.user, "suggestion", button.channel!).catch(() => {
        throw "You do not have permission to view anonymous suggestions' authors.";
    });

    const entry = await db.suggestionPosts.findOne({ message: button.message.id });
    if (!entry) throw "This is not a suggestion post.";

    const user = await (await getClient()).users.fetch(entry.user).catch(() => {});

    if (!user) throw `The suggestion author's account no longer exists. (ID: \`${entry.user}\`)`;
    return template.info(`Suggestion #${entry.id} was submitted by ${expand(user)}.`);
}
