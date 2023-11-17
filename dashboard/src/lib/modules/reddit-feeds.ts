import type { FEData, FERedditFeedsSettings } from "$lib/types.js";
import type { DbRedditFeedsSettings } from "shared";
import { defaults } from "./utils.js";

export async function b2fRedditFeedsSettings(fe: FEData, data: Partial<DbRedditFeedsSettings> | null): Promise<FERedditFeedsSettings> {
    return defaults(data, { feeds: [] });
}

export async function f2bRedditFeedsSettings(data: FERedditFeedsSettings): Promise<DbRedditFeedsSettings> {
    if (data.feeds.some((x) => x.subreddit.trim().length === 0)) throw "All entries must have a non-empty subreddit.";

    return data;
}
