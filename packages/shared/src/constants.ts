import { PublicKey } from '@solana/web3.js';

// ============================================================================
// NETWORK & RPC
// ============================================================================
export const NETWORK = 'devnet';
export const RPC_URL = 'https://api.devnet.solana.com';
export const FALLBACK_RPC_URLS = [
    'https://api.devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet',
];

// LazorKit specific
export const PORTAL_URL = 'https://portal.lazor.sh';
export const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

// ============================================================================
// TOKENS & PROGRAMS
// ============================================================================
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const SUBSCRIPTION_PROGRAM_ID = new PublicKey('3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v');
export const MERCHANT_WALLET = new PublicKey('CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv');

// ============================================================================
// COMPUTE UNITS
// ============================================================================
export const COMPUTE_UNITS = {
    TRANSFER: 200_000,
    SWAP: 600_000,
    NFT_MINT: 400_000,
    DEFAULT_LIMIT: 600_000,
};

// ============================================================================
// EXTERNAL PROTOCOLS
// ============================================================================
export const RAYDIUM_DEV_BASE_HOST = 'https://api-v3-devnet.raydium.io';
export const RAYDIUM_DEV_SWAP_HOST = 'https://transaction-v1-devnet.raydium.io';
export const RAYDIUM_DEV_PRIORITY_FEE = '/main/auto-fee';

export const EXPLORER_BASE_URL = 'https://explorer.solana.com';

// ============================================================================
// SUBSCRIPTION PLANS
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

export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
    return `${EXPLORER_BASE_URL}/tx/${signature}?cluster=${cluster}`;
}
