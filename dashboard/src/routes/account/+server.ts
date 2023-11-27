import type { DBAccountSettings } from "shared";
import { db } from "shared/db.js";
import { z } from "zod";
import type { RequestHandler } from "./$types.js";

const schema = z.object({
    notifyWhenOwnedServerPremiumStatusChanges: z.boolean(),
    notifyWhenManagedServerPremiumStatusChanges: z.boolean(),
    suppressAdminBroadcasts: z.boolean(),
}) satisfies z.ZodType<DBAccountSettings>;

export const POST: RequestHandler = async ({ locals: { user }, request }) => {
    if (!user) throw "You are not signed in.";

    let data: DBAccountSettings;
    try {
        data = schema.parse(await request.json());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw error.errors.map(({ message }: { message: string }) => message).join(" ");
    }

    await db.accountSettings.updateOne({ user: user.id }, { $set: data }, { upsert: true });
    return new Response();
};
