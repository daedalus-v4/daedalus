import type { FEAutomodSettings, FEData } from "$lib/types.js";
import type { DbAutomodSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fAutomodSettings(fe: FEData, data: Partial<DbAutomodSettings> | null): Promise<FEAutomodSettings> {
    return defaults(data, { ignoredChannels: [], ignoredRoles: [], defaultChannel: null, interactWithWebhooks: false, rules: [] });
}

export async function f2bAutomodSettings(data: FEAutomodSettings): Promise<DbAutomodSettings> {
    for (const rule of data.rules) {
        try {
            if (rule.type === "blocked-terms") {
                if (rule.blockedTermsData.terms.some((x) => x.match(/^\*\s|\s\*$/) || x.replace(/^\*?\s*|\s*\*?$/g, "").length < 3))
                    throw `Terms must be at least 3 characters long (not counting wildcard) and wildcards must not be adjacent to whitespace.`;
                if (rule.blockedTermsData.terms.length > 1000) throw `Maximum 1000 terms allowed`;
            } else if (rule.type === "blocked-stickers") {
                if (rule.blockedStickersData.ids.some((x) => !x.match(/^[1-9][0-9]{16,19}$/))) throw `IDs must be Discord IDs (17-20 digit numbers))`;
                if (rule.blockedStickersData.ids.length > 1000) throw `Maximum 1000 stickers allowed`;
            } else if (rule.type === "invite-links") {
                if ([...rule.inviteLinksData.allowed, ...rule.inviteLinksData.blocked].some((x) => !x.match(/^[1-9][0-9]{16,19}$/)))
                    throw `IDs must be Discord IDs (17-20 digit numbers))`;
                if (rule.inviteLinksData.allowed.length > 1000 || rule.inviteLinksData.blocked.length > 1000) throw `Maximum 1000 servers allowed`;
            } else if (rule.type === "link-blocklist") {
                if (rule.linkBlocklistData.websites.some((x) => x.match(/^\w+:\/\//) || !x.match(/.\../)))
                    throw `Links should not contain the schema and should be valid URL components`;
                if (rule.linkBlocklistData.websites.length > 1000) throw `Maximum 1000 links allowed.`;
            }

            if (rule.additionalAction === "timeout" && rule.actionDuration > 28 * 24 * 60 * 60 * 1000) throw `Members can only be timed out for up to 28 days`;
        } catch (error) {
            throw `${error} [error in ${rule.name}]`;
        }
    }

    return data;
}
