import { PremiumBenefits } from "./types.js";

export const limits = {
    supporterAnnouncementsCount: [2, 5],
    xpBonusChannelCount: [2, 5],
    xpBonusRoleCount: [2, 5],
    xpRewardCount: [2, 5],
    reactionRolesCount: [2, 5],
    purgeAtOnce: [100, 1000],
    automodCount: [2, 5],
} satisfies Record<string, [number, number]>;

export function getLimit(key: keyof typeof limits, premium: boolean | PremiumBenefits) {
    return limits[key][(typeof premium === "boolean" ? premium : premium.increasedLimits) ? 1 : 0];
}
