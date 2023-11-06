import { DbXpAmounts } from "shared";
import { db } from "shared/db.js";
import cycle from "./cycle.js";

cycle(
    async () => {
        const now = new Date();
        const { lastXpPurge } = (await db.globals.findOneAndUpdate({}, { $set: { lastXpPurge: now.getTime() } }, { upsert: true })) ?? { lastXpPurge: 0 };

        const last = new Date(lastXpPurge);

        const $set: Partial<DbXpAmounts> = {};

        if (now.getDate() !== last.getDate()) $set.daily = { text: 0, voice: 0 };

        if (Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)) !== Math.floor(last.getTime() / (7 * 24 * 60 * 60 * 1000)))
            $set.weekly = { text: 0, voice: 0 };

        if (now.getMonth() !== last.getMonth()) $set.monthly = { text: 0, voice: 0 };
    },
    24 * 60 * 60 * 1000,
    "ec76ff0f-0c71-4def-a255-b08b4a0b8f43",
);
