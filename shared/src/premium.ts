import { PremiumBenefits } from "./types.js";

export enum PremiumTier {
    FREE = 0,
    BASIC,
    ULTIMATE,
}

export const premiumBenefits: Record<PremiumTier, PremiumBenefits> = {
    [PremiumTier.FREE]: { name: "Free Tier", vanityClient: false, increasedLimits: false, customizeXpBackgrounds: false },
    [PremiumTier.BASIC]: { name: "Daedalus Premium (Basic)", vanityClient: false, increasedLimits: true, customizeXpBackgrounds: true },
    [PremiumTier.ULTIMATE]: { name: "Daedalus Premium (Ultimate)", vanityClient: true, increasedLimits: true, customizeXpBackgrounds: true },
};
