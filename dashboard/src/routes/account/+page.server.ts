import { defaults } from "$lib/modules/utils.js";
import type { DBAccountSettings } from "shared";
import { db } from "shared/db.js";
import type { PageServerLoad } from "../$types.js";

export const load: PageServerLoad = async ({ locals: { user } }) => {
    if (!user) return;

    return {
        data: defaults<DBAccountSettings>(await db.accountSettings.findOne({ user: user.id }), {
            notifyWhenOwnedServerPremiumStatusChanges: true,
            notifyWhenManagedServerPremiumStatusChanges: false,
        }),
    };
};
