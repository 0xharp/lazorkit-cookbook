import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { APP_SCHEME } from '@/lib/constants';

interface WalletContextValue {
    wallet: { smartWallet: string } | null;
    isConnected: boolean;
    connecting: boolean;
    connect: (redirectPath?: string) => Promise<void>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (
        payload: Parameters<ReturnType<typeof useWallet>['signAndSendTransaction']>[0],
        redirectPath?: string
    ) => Promise<unknown>;
    signMessage: (message: string, redirectPath?: string) => Promise<unknown>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const {
        wallet: sdkWallet,
        isConnected: sdkIsConnected,
        connect,
        disconnect,
        signAndSendTransaction,
        signMessage,
    } = useWallet();

    const [connecting, setConnecting] = useState(false);
    // Shared wallet state that persists across all components
    const [localWallet, setLocalWallet] = useState<{ smartWallet: string } | null>(null);

    // Sync local state with SDK state when SDK wallet changes
    useEffect(() => {
        if (sdkWallet?.smartWallet) {
            setLocalWallet({ smartWallet: sdkWallet.smartWallet });
        }
    }, [sdkWallet?.smartWallet]);

    // Use local wallet if available, fallback to SDK wallet
    const wallet = localWallet || sdkWallet;

    // Derive connection status from having a valid wallet address
    const isConnected = sdkIsConnected && !!wallet?.smartWallet;

    const handleConnect = useCallback(async (redirectPath: string = '') => {
        setConnecting(true);
        try {
            await connect({
                redirectUrl: `${APP_SCHEME}${redirectPath}`,
                onSuccess: (connectedWallet) => {
                    setConnecting(false);
                    // Store wallet in shared context state
                    setLocalWallet({ smartWallet: connectedWallet.smartWallet });
                    console.log('Connected:', connectedWallet.smartWallet);
                },
                onFail: (error) => {
                    setConnecting(false);
                    Alert.alert(
                        'Connection Failed',
                        error.message || 'Failed to connect wallet. Please try again.'
                    );
                },
            });
        } catch (error) {
            setConnecting(false);
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Connection Error', message);
        }
    }, [connect]);

    const handleDisconnect = useCallback(async () => {
        try {
            await disconnect({
                onSuccess: () => {
                    setLocalWallet(null);
                    console.log('Disconnected');
                },
                onFail: (error) => {
                    Alert.alert('Disconnect Failed', error.message);
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Disconnect Error', message);
        }
    }, [disconnect]);

    const handleSignAndSend = useCallback(
        async (
            payload: Parameters<typeof signAndSendTransaction>[0],
            redirectPath: string = ''
        ) => {
            return signAndSendTransaction(payload, {
                redirectUrl: `${APP_SCHEME}${redirectPath}`,
            });
        },
        [signAndSendTransaction]
    );

    const handleSignMessage = useCallback(
        async (message: string, redirectPath: string = '') => {
            return signMessage(message, {
                redirectUrl: `${APP_SCHEME}${redirectPath}`,
            });
        },
        [signMessage]
    );

    return (
        <WalletContext.Provider
            value={{
                wallet,
                isConnected,
                connecting,
                connect: handleConnect,
                disconnect: handleDisconnect,
                signAndSendTransaction: handleSignAndSend,
                signMessage: handleSignMessage,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWalletContext() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }
    return context;
}
