'use client';

import { useEffect, ReactNode } from 'react';
import { registerLazorkitWallet } from '@lazorkit/wallet';

const CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  PORTAL_URL: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh',
  PAYMASTER: {
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com',
  },
  CLUSTER: 'devnet' as const,
};

// Module-level flag to ensure single registration across HMR
let lazorkitRegistered = false;

export default function WalletAdapterLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register LazorKit once for all wallet adapter recipes
    if (!lazorkitRegistered) {
      lazorkitRegistered = true;
      registerLazorkitWallet({
        rpcUrl: CONFIG.RPC_URL,
        portalUrl: CONFIG.PORTAL_URL,
        paymasterConfig: CONFIG.PAYMASTER,
        clusterSimulation: CONFIG.CLUSTER,
      });
    }
  }, []);

  return <>{children}</>;
}
