// ============================================================================
// SUBSCRIPTION CONFIGURATION
// Single source of truth for all plans, pricing, and settings
// ============================================================================

export interface PlanFeatures {
    id: string;
    name: string;
    displayName: string;
    price: number; // in USDC
    priceDisplay: string;
    interval: number; // in seconds
    intervalDisplay: string;
    popular?: boolean;
    badge?: string;
    badgeColor?: 'purple' | 'emerald' | 'blue';
    description?: string;
    features: string[];
}

// All available subscription plans
export const PLANS: Record<string, PlanFeatures> = {
    test: {
        id: 'test',
        name: 'Test',
        displayName: 'Test Plan',
        price: 0.01,
        priceDisplay: '$0.01',
        interval: 60,
        intervalDisplay: 'minute',
        description: 'Perfect for trying out our service',
        features: [
            'Prepaid - first month charged now',
            'Automatic recurring billing',
            'Zero gas fees',
            'Cancel anytime (refund setup fee)',
            'Face ID authentication',
        ]
    },
    basic: {
        id: 'basic',
        name: 'Basic',
        displayName: 'Basic Plan',
        price: 0.1,
        priceDisplay: '$0.10',
        interval: 30 * 24 * 60 * 60, // 30 days
        intervalDisplay: 'month',
        description: 'Perfect for trying out our service',
        features: [
            'Prepaid - first month charged now',
            'Automatic recurring billing',
            'Zero gas fees',
            'Cancel anytime (refund setup fee)',
            'Face ID authentication',
        ]
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        displayName: 'Pro Plan',
        price: 0.2,
        priceDisplay: '$0.20',
        interval: 30 * 24 * 60 * 60, // 30 days
        intervalDisplay: 'month',
        popular: true,
        badge: 'POPULAR',
        badgeColor: 'purple',
        description: 'Most popular choice for regular users',
        features: [
            'Prepaid - first month charged now',
            'Automatic recurring billing',
            'Zero gas fees',
            'Priority support',
            'Advanced analytics',
            'API access',
            'Cancel anytime (refund setup fee)',
            'Face ID authentication',
        ]
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        displayName: 'Enterprise Plan',
        price: 0.3,
        priceDisplay: '$0.30',
        interval: 30 * 24 * 60 * 60, // 30 days
        intervalDisplay: 'month',
        badge: 'BEST VALUE',
        badgeColor: 'emerald',
        description: 'For power users who need everything',
        features: [
            'Prepaid - first month charged now',
            'Automatic recurring billing',
            'Zero gas fees',
            'All Pro features',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee',
            'Cancel anytime (refund setup fee)',
            'Face ID authentication',
        ]
    }
} as const;

export type PlanId = keyof typeof PLANS;

// System constants
export const SUBSCRIPTION_CONSTANTS = {
    // Network configuration
    NETWORK: 'devnet' as const,
    RPC_URL: 'https://api.devnet.solana.com',
    FALLBACK_RPC_URLS: [
        'https://api.devnet.solana.com',
        'https://rpc.ankr.com/solana_devnet',
    ],

    // Transaction configuration
    COMPUTE_UNIT_LIMIT: 600_000, // Increased for prepaid transactions with token transfers

    // Costs
    SETUP_FEE_SOL: 0.002, // PDA rent cost in SOL
    SETUP_FEE_USD: 0.0005, // Approximate USD value

    // Timing
    DEFAULT_EXPIRY_MONTHS: 12,
    EXPIRY_OPTIONS: [
        { value: 3, label: '3 months' },
        { value: 6, label: '6 months' },
        { value: 12, label: '12 months' },
        { value: 0, label: 'No expiry' },
    ],
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): PlanFeatures | undefined {
    return PLANS[planId as PlanId];
}

/**
 * Get the default/popular plan
 */
export function getDefaultPlan(): PlanFeatures {
    return Object.values(PLANS).find(plan => plan.popular) || PLANS.pro;
}

/**
 * Get all plans as an array
 */
export function getAllPlans(): PlanFeatures[] {
    return Object.values(PLANS);
}

/**
 * Format price in USDC
 */
export function formatPrice(priceUSDC: number): string {
    return `$${priceUSDC.toFixed(2)}`;
}

/**
 * Format interval (seconds) to human-readable string
 */
export function formatInterval(intervalSeconds: number): string {
    const days = Math.floor(intervalSeconds / (24 * 60 * 60));
    if (days < 1) return `${intervalSeconds} seconds`;
    return `${days} days`;
}

/**
 * Calculate expiry timestamp from months
 */
export function calculateExpiryTimestamp(months: number): number | undefined {
    if (months === 0) return undefined;
    return Math.floor(Date.now() / 1000) + (months * 30 * 24 * 60 * 60);
}

/**
 * Get badge color classes for Tailwind
 */
export function getBadgeColorClasses(color?: PlanFeatures['badgeColor']): string {
    switch (color) {
        case 'purple':
            return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
        case 'emerald':
            return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
        case 'blue':
            return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
        default:
            return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
    }
}

/**
 * Get gradient classes for popular plans
 */
export function getGradientClasses(popular?: boolean): string {
    if (popular) {
        return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-purple-500/50';
    }
    return 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
}