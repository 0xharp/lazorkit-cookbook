'use client';

import { LazorkitProvider as LazorkitWalletProvider } from '@lazorkit/wallet';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export function LazorkitProvider({ children }: Props) {
    return (
        <LazorkitWalletProvider
            rpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'}
            portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'}
            paymasterConfig={{
                paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com'
            }}
        >
            {children}
        </LazorkitWalletProvider>
    );
}