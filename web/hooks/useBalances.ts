'use client';

import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getBalances, getConnection } from '@/lib/solana-utils';

interface BalanceState {
    sol: number | null;
    usdc: number | null;
    loading: boolean;
    error: string | null;
}

interface UseBalancesOptions {
    autoFetch?: boolean;
}

export function useBalances(
    walletAddress: string | null | undefined,
    options: UseBalancesOptions = {}
) {
    const { autoFetch = true } = options;

    const [state, setState] = useState<BalanceState>({
        sol: null,
        usdc: null,
        loading: false,
        error: null,
    });

    const fetchBalances = useCallback(async () => {
        if (!walletAddress) {
            setState({ sol: null, usdc: null, loading: false, error: null });
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const connection = getConnection();
            const publicKey = new PublicKey(walletAddress);
            const { sol, usdc } = await getBalances(connection, publicKey);

            setState({
                sol,
                usdc,
                loading: false,
                error: null,
            });
        } catch (err) {
            console.error('Error fetching balances:', err);
            setState(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to fetch balances',
            }));
        }
    }, [walletAddress]);

    const reset = useCallback(() => {
        setState({ sol: null, usdc: null, loading: false, error: null });
    }, []);

    useEffect(() => {
        if (autoFetch && walletAddress) {
            fetchBalances();
        }
    }, [autoFetch, walletAddress, fetchBalances]);

    return {
        solBalance: state.sol,
        usdcBalance: state.usdc,
        loading: state.loading,
        error: state.error,
        fetchBalances,
        reset,
    };
}
