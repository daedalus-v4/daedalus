import { PremiumBenefits } from "./types.js";

export enum PremiumTier {
    FREE = 0,
    BASIC,
    ULTIMATE,
}

export const premiumBenefits: Record<PremiumTier, PremiumBenefits> = {
    [PremiumTier.FREE]: {
        name: "Free Tier",
        vanityClient: false,
        increasedLimits: 0,
        customizeXpBackgrounds: false,
        multiModmail: false,
    },
    [PremiumTier.BASIC]: {
        name: "Daedalus Premium (Basic)",
        vanityClient: false,
        increasedLimits: 1,
        customizeXpBackgrounds: true,
        multiModmail: true,
    },
    [PremiumTier.ULTIMATE]: {
        name: "Daedalus Premium (Ultimate)",
        vanityClient: true,
        increasedLimits: 2,
        customizeXpBackgrounds: true,
        multiModmail: true,
    },
};
