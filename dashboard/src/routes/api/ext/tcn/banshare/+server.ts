import { TCN_HMAC_KEY } from "$env/static/private";
import crypto from "crypto";
import type { RequestHandler } from "./$types.js";

const key = crypto.createPrivateKey(TCN_HMAC_KEY);

export const POST: RequestHandler = async ({ url }) => {
    const userid = url.searchParams.get("u");
    const reason = url.searchParams.get("r");
    const origin = url.searchParams.get("o");
    const hmac = url.searchParams.get("h");

    if (!userid || !reason || !origin || !hmac) return new Response("", { status: 400 });

    if (!crypto.timingSafeEqual(Buffer.from(hmac, "base64url"), crypto.createHmac("sha256", key).update(`${userid} ${reason} ${origin}`).digest()))
        return new Response("", { status: 403 });

    // TODO
    throw 0;
};
