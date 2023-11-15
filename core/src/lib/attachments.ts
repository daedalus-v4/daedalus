import { Message } from "discord.js";

export async function dataEncodeAttachments(message: Message) {
    return await Promise.all(
        message.attachments.map(async (x) => {
            const req = await fetch(x.url).catch(() => {});
            const res = await req?.arrayBuffer();

            return { name: x.name, url: `data:${x.contentType ?? "application/octet-stream"};base64,${res ? Buffer.from(res).toString("base64") : ""}` };
        }),
    );
}
