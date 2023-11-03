import { Attachment, AttachmentPayload, Message, PartialMessage } from "discord.js";
import stickerCache from "./sticker-cache.js";

export enum SpoilerLevel {
    SHOW = -1,
    KEEP = 0,
    HIDE = 1,
}

export function copyFiles(files: Iterable<Attachment>, spoilerLevel: SpoilerLevel): AttachmentPayload[] {
    const attachments: AttachmentPayload[] = [];

    for (const attachment of files) {
        let { name } = attachment;
        const spoiler = name.startsWith("SPOILER_");
        name = name.match(/^(SPOILER_)*(.*)$/)![2] || "file";
        if ((spoilerLevel === SpoilerLevel.KEEP && spoiler) || spoilerLevel === SpoilerLevel.HIDE) name = `SPOILER_${name}`;
        attachments.push({ attachment: attachment.url, name });
    }

    return attachments;
}

export async function copyMedia(message: Message | PartialMessage, spoilerLevel: SpoilerLevel): Promise<AttachmentPayload[]> {
    const attachments = copyFiles(message.attachments.values(), spoilerLevel);

    for (const sticker of message.stickers.values())
        try {
            const path = await stickerCache.fetch(sticker);

            if (path) attachments.push({ attachment: path, name: `${spoilerLevel > 0 ? "SPOILER_" : ""}${sticker.name}.${stickerCache.ext(sticker)}` });
            else throw 0;
        } catch {
            attachments.push({ attachment: Buffer.from([]), name: `${spoilerLevel > 0 ? "SPOILER_" : ""}${sticker.name}.${stickerCache.ext(sticker)}` });
        }

    return attachments;
}
