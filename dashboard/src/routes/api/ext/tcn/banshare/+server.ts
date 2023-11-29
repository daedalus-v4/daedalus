import { TCN_HMAC_KEY } from "$env/static/private";
import crypto from "crypto";
import { autoIncrement, db } from "shared/db.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ url }) => {
    const server = url.searchParams.get("g");
    const userid = url.searchParams.get("u");
    const reason = url.searchParams.get("r");
    const origin = url.searchParams.get("o");
    const tcnbot = url.searchParams.get("i");
    const hmac = url.searchParams.get("h");

    if (!server || !userid || !reason || !origin || !tcnbot || !hmac) return new Response("", { status: 400 });

    if (
        !crypto.timingSafeEqual(
            Buffer.from(hmac, "base64url"),
            crypto.createHmac("sha256", TCN_HMAC_KEY).update(`${server} ${userid} ${reason} ${origin} ${tcnbot}`).digest(),
        )
    )
        return new Response("", { status: 403 });

    await db.userHistory.insertOne({
        guild: server,
        user: userid,
        id: await autoIncrement(`history/${server}`),
        type: "ban",
        mod: tcnbot,
        time: Date.now(),
        duration: Infinity,
        origin,
        reason,
    });

    return new Response();
};
