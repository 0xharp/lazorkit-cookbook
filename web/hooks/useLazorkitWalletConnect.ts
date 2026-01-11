'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';

interface UseLazorkitWalletConnectOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useLazorkitWalletConnect(options: UseLazorkitWalletConnectOptions = {}) {
    const { connect, disconnect, wallet, isConnected, signAndSendTransaction } = useWallet();
    const [connecting, setConnecting] = useState(false);

    const handleConnect = useCallback(async () => {
        setConnecting(true);
        try {
            await connect();
            options.onSuccess?.();
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));

            if (error.message?.includes('popup') || error.message?.includes('blocked')) {
                alert('Popup Blocked!\n\nPlease allow popups for this site in your browser settings.');
            } else {
                alert(`Failed to connect: ${error.message || 'Unknown error'}`);
            }

            options.onError?.(error);
        } finally {
            setConnecting(false);
        }
    }, [connect, options]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    return {
        connect: handleConnect,
        disconnect: handleDisconnect,
        connecting,
        isConnected,
        wallet,
        signAndSendTransaction,
    };
}
