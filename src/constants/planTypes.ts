export const PLAN_TYPES = {
    LOCAL_ACTIVITY: "LOCAL_ACTIVITY",
    REGIONAL_ACTIVITY: "REGIONAL_ACTIVITY",
    DIGITAL_SHOWCASE: "DIGITAL_SHOWCASE",
    TOUR_OPERATOR: "TOUR_OPERATOR",
    TOUR_GUIDE: "TOUR_GUIDE",
    PRO_USER: "PRO_USER",
    PRO_USER_PLUS: "PRO_USER_PLUS"
} as const;

export type PlanType = keyof typeof PLAN_TYPES;

/**
 * Runtime governance layer.
 * 
 * Traduce i plan_type tecnici del DB
 * nel dominio business/runtime utilizzato dalla UI.
 * 
 * Questa è la SOURCE OF TRUTH del dominio Sponsor/Plans.
 */
export const PLAN_RUNTIME_META = {
    LOCAL_ACTIVITY: {
        tier: 'silver',
        label: 'Silver'
    },

    REGIONAL_ACTIVITY: {
        tier: 'gold',
        label: 'Gold'
    },

    DIGITAL_SHOWCASE: {
        tier: 'standard',
        label: 'Vetrina Digitale'
    },

    TOUR_OPERATOR: {
        tier: 'operator',
        label: 'Tour Operator'
    },

    TOUR_GUIDE: {
        tier: 'guide',
        label: 'Guida Turistica'
    },

    PRO_USER: {
        tier: 'pro',
        label: 'Utente Pro'
    },

    PRO_USER_PLUS: {
        tier: 'pro_plus',
        label: 'Utente Pro Plus'
    }
} as const;

export const SPONSOR_TIER_VALUES = Object.values(PLAN_RUNTIME_META).map(m => m.tier);

/**
 * Runtime tier derivato dal dominio business.
 */
export type RuntimeTier =
    typeof PLAN_RUNTIME_META[keyof typeof PLAN_RUNTIME_META]['tier'];

/**
 * Alias di compatibilità per il dominio Sponsor.
 */
export type SponsorTier = RuntimeTier;

/**
 * Runtime label derivata dal dominio business.
 */
export type RuntimeLabel =
    typeof PLAN_RUNTIME_META[keyof typeof PLAN_RUNTIME_META]['label'];

/**
 * Resource type derivato dal dominio business per PointOfInterest.
 */
export type RuntimeResourceType = 'guide' | 'operator' | 'service';

/**
 * Resolver centralizzato:
 * PLAN_TYPE -> runtime tier
 */
export const resolvePlanTier = (
    planType?: string | null
): RuntimeTier => {
    if (!planType || !(planType in PLAN_RUNTIME_META)) {
        return 'standard';
    }

    return PLAN_RUNTIME_META[planType as PlanType].tier;
};

/**
 * Resolver centralizzato:
 * PLAN_TYPE -> label business
 */
export const resolvePlanLabel = (
    planType?: string | null
): RuntimeLabel | 'Standard' => {
    if (!planType || !(planType in PLAN_RUNTIME_META)) {
        return 'Standard';
    }

    return PLAN_RUNTIME_META[planType as PlanType].label;
};

/**
 * Resolver centralizzato:
 * PLAN_TYPE -> resource type (per PointOfInterest)
 */
export const resolveResourceType = (
    planType?: string | null
): RuntimeResourceType | undefined => {
    if (!planType) return undefined;
    
    if (planType === PLAN_TYPES.TOUR_GUIDE) return 'guide';
    if (planType === PLAN_TYPES.TOUR_OPERATOR) return 'operator';
    
    return undefined;
};