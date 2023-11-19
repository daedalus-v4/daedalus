import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { expand, template } from "../../lib/format.js";

export default async function (button: ButtonInteraction) {
    const caller = await button.guild!.members.fetch(button.user);

    if (caller.id !== button.guild!.ownerId) {
        const settings = await db.reportsSettings.findOne({ guild: button.guild!.id });
        if (!settings || !caller.roles.cache.hasAny(...settings.viewRoles)) throw "You do not have permission to view anonymous reporters.";
    }

    const entry = await db.reporters.findOne({ message: button.message.id });
    if (!entry) throw "The reporter could not be found.";

    const user = await button.client.users.fetch(entry.user).catch(() => {});
    if (!user) throw "The reporter's account no longer exists.";

    return template.info(`That report was submitted by ${expand(user)}.`);
}
