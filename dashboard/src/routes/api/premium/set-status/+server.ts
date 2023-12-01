import { API, TOKEN } from "$env/static/private";
import getClient from "$lib/get-client.js";
import { ActivityType, type PresenceStatusData } from "discord.js";
import { db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) return new Response("You must be signed in.", { status: 401 });

    const guild = url.searchParams.get("guild") ?? "";

    const status = url.searchParams.get("status") || "online";
    const activityType = url.searchParams.get("activityType") || null;
    const statusText = url.searchParams.get("statusText") ?? "";

    {
        const req = await fetch(`${API}/check-guild`, {
            method: "POST",
            body: JSON.stringify({ user: locals.user.id, guild }),
            headers: { "Content-Type": "application/json" },
        });

        const res: { valid: boolean } = await req.json();
        if (!res.valid) return new Response("You do not have permission to manage this server.", { status: 403 });
    }

    await db.guilds.updateOne({ guild }, { $set: { status, activityType, statusText } }, { upsert: true });

    const client = await getClient(guild);

    if (client.token !== TOKEN)
        client.user!.setPresence({
            status: status as PresenceStatusData,
            activities:
                activityType === "Custom" && statusText.trim() === ""
                    ? []
                    : [{ type: ActivityType[activityType as keyof typeof ActivityType] ?? ActivityType.Custom, name: statusText }],
        });

    return new Response();
};
