import { PremiumBenefits } from "./types.js";

export const limits = {
    supporterAnnouncementsCount: [2, 5, 5],
    xpBonusChannelCount: [2, 5, 5],
    xpBonusRoleCount: [2, 5, 5],
    xpRewardCount: [2, 5, 5],
    reactionRolesCount: [2, 5, 5],
    purgeAtOnce: [100, 1000, 1000],
    automodCount: [2, 5, 5],
    statsChannelsCount: [2, 5, 5],
    autoresponderCount: [2, 5, 5],
    modmailTargetCount: [1, 3, 10],
} satisfies Record<string, [number, number, number]>;

export function getLimit(key: keyof typeof limits, premium: PremiumBenefits | 0 | 1 | 2) {
    return limits[key][typeof premium === "number" ? premium : premium.increasedLimits];
}
