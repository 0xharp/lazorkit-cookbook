import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getSolBalance, getUsdcBalance } from '@/lib/solana-utils';

/**
 * Hook for managing SOL and USDC balances
 * Auto-fetches when wallet address changes
 */
export function useBalances(walletAddress: string | null | undefined) {
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBalances = useCallback(async () => {
        if (!walletAddress) {
            setSolBalance(null);
            setUsdcBalance(null);
            return;
        }

        setLoading(true);
        try {
            const connection = getConnection();
            const publicKey = new PublicKey(walletAddress);

            const [sol, usdc] = await Promise.all([
                getSolBalance(connection, publicKey),
                getUsdcBalance(connection, publicKey),
            ]);

            setSolBalance(sol);
            setUsdcBalance(usdc);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    const reset = useCallback(() => {
        setSolBalance(null);
        setUsdcBalance(null);
    }, []);

    // Auto-fetch when wallet changes
    useEffect(() => {
        if (walletAddress) {
            fetchBalances();
        } else {
            reset();
        }
    }, [walletAddress, fetchBalances, reset]);

    return {
        solBalance,
        usdcBalance,
        loading,
        fetchBalances,
        reset,
    };
}
