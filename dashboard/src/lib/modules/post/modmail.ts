import type { DbModmailSettings } from "shared";
import { db } from "shared/db.js";

export default async function (settings: DbModmailSettings, currentGuild: string): Promise<DbModmailSettings> {
    const ids = [...new Set((await db.modmailThreads.find({ guild: currentGuild, closed: false }).toArray()).map((x) => x.id))];

    if (ids.some((x) => !settings.targets.some((k) => k.id === x)))
        throw "You cannot delete any modmail targets that currently have open threads. Please close those threads first.";

    return settings;
}
