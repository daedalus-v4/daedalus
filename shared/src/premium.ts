import { PremiumBenefits } from "./types.js";

export enum PremiumTier {
    FREE = 0,
    BASIC,
    ULTIMATE,
}

export const premiumBenefits: Record<PremiumTier, PremiumBenefits> = {
    [PremiumTier.FREE]: { vanityClient: false, increasedLimits: false },
    [PremiumTier.BASIC]: { vanityClient: false, increasedLimits: true },
    [PremiumTier.ULTIMATE]: { vanityClient: true, increasedLimits: true },
};
