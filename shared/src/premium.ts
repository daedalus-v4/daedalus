export enum PremiumTier {
    FREE = 0,
    BASIC,
    ULTIMATE,
}

export const premiumBenefits: Record<PremiumTier, { vanityClient: boolean }> = {
    [PremiumTier.FREE]: { vanityClient: false },
    [PremiumTier.BASIC]: { vanityClient: false },
    [PremiumTier.ULTIMATE]: { vanityClient: true },
};
