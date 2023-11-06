import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";
import { check } from "../../lib/permissions.js";

export default async function (button: ButtonInteraction, user: string) {
    const denyReason = await check(button.user, "xp", button.channel!);
    if (denyReason) return void (await button.update(template.error(denyReason)));

    await db.xpAmounts.deleteOne({ guild: button.guild!.id, user });
    await button.update(template.success(`<@${user}>'s XP has been fully reset.`));
}
