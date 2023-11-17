import { APIButtonComponent, ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";

export default async function (button: ButtonInteraction, vote: string) {
    if (vote !== "yes" && vote !== "no") return;

    const doc = await db.suggestionPosts.findOneAndUpdate(
        { message: button.message.id },
        { $addToSet: { [vote]: button.user.id }, $pull: { [vote === "yes" ? "no" : "yes"]: button.user.id } },
    );

    if (!doc) throw "This is not a suggestion post.";
    if (doc[vote].includes(button.user.id)) return template.info("Your vote was not changed.");

    const yes = doc.yes.length + (vote === "yes" ? 1 : doc.yes.includes(button.user.id) ? -1 : 0);
    const no = doc.no.length + (vote === "no" ? 1 : doc.no.includes(button.user.id) ? -1 : 0);

    const components = button.message.components.map((row) => row.toJSON());

    (components[0].components[0] as APIButtonComponent).label = `${yes}`;
    (components[0].components[1] as APIButtonComponent).label = `${no}`;

    await button.update({ components });
}
