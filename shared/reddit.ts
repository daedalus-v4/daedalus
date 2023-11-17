import { db } from "./db.js";

export async function getRedditAccessToken(id: string, secret: string, user: string): Promise<string | null> {
    const entry = await db.redditTokens.findOne({ user });
    if (!entry) return null;

    if (entry.expiry - Date.now() <= 120000) {
        const request = await fetch("https://www.reddit.com/api/v1/access_token", {
            method: "POST",
            headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
            body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: entry.refresh }),
        });

        if (!request.ok) return null;

        const response = (await request.json()) as any;
        await db.redditTokens.updateOne({ user }, { $set: { token: response.access_token, expiry: Date.now() + response.expires_in * 1000 } });
        return response.access_token;
    }

    return entry.token;
}
