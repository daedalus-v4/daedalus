import { PUBLIC_DISCORD_ID } from "$env/static/public";

export default function (guild?: string) {
    return `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        client_id: PUBLIC_DISCORD_ID,
        permissions: "1428010036470",
        scope: "applications.commands bot",
        ...(guild ? { guild_id: guild } : {}),
    })}`;
}
