import { PublicKey } from '@solana/web3.js';

// App configuration
export const APP_SCHEME = 'lazorkitcookbook://';

// Raydium Configuration because Raydium SDK URLS are not properly compiled while using React Native
export const RAYDIUM_DEV_BASE_HOST = 'https://api-v3-devnet.raydium.io';
export const RAYDIUM_DEV_SWAP_HOST = 'https://transaction-v1-devnet.raydium.io';
export const RAYDIUM_DEV_PRIORITY_FEE = '/main/auto-fee';

// Network configuration (Devnet)
export const RPC_URL = 'https://api.devnet.solana.com';
export const PORTAL_URL = 'https://portal.lazor.sh';
export const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

// Token configuration
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Compute unit limits for different operations
export const COMPUTE_UNITS = {
    TRANSFER: 200_000,
    SWAP: 600_000,
    NFT_MINT: 400_000,
};

// Explorer URL
export const EXPLORER_BASE_URL = 'https://explorer.solana.com';

export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
    return `${EXPLORER_BASE_URL}/tx/${signature}?cluster=${cluster}`;
}