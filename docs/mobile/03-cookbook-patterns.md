# Mobile Cookbook Patterns

This guide explains the patterns we created in this cookbook to make LazorKit mobile integration seamless. These are reusable patterns you can adopt in your own React Native projects.

## Understanding the Architecture

The LazorKit Mobile SDK (`@lazorkit/wallet-mobile-adapter`) provides the core functionality:
- Passkey-based wallet creation via deep linking
- Gasless transaction sending via paymaster
- `useWallet()` hook for wallet interactions

This cookbook adds a layer of utilities and patterns on top:

```
Your React Native App
    ↓
┌───────────────────────────────────────────┐
│  Cookbook Patterns (what we built)        │
│  - WalletContext (shared state wrapper)   │
│  - useLazorkitWalletConnect (convenience hook)   │
│  - processInstructionsForLazorKit         │
│  - useBalances                            │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│  @lazorkit/wallet-mobile-adapter (SDK)    │
│  - LazorKitProvider                       │
│  - useWallet() → signAndSendTransaction() │
│  - Deep link authentication               │
│  - Paymaster service                      │
└───────────────────────────────────────────┘
    ↓
Solana Network
```

---

## Pattern 1: WalletContext Wrapper

### The Challenge

On mobile, the LazorKit SDK uses deep linking for authentication. When a user connects their wallet:
1. The app opens an external browser to the LazorKit portal
2. User authenticates with passkey (Face ID/Touch ID)
3. Browser redirects back to your app via deep link

This flow introduces challenges:
- **State persistence**: Wallet state may be lost when returning from the browser
- **Redirect URL management**: Every `connect()` and `signAndSendTransaction()` call needs a `redirectUrl`
- **Error handling**: Need consistent error display across screens

### Our Solution: WalletContext

We created a React Context that wraps the LazorKit SDK and handles these concerns:

```typescript
// contexts/WalletContext.tsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

interface WalletContextValue {
    wallet: { smartWallet: string } | null;
    isConnected: boolean;
    connecting: boolean;
    connect: (redirectPath?: string) => Promise<void>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (payload: any, redirectPath?: string) => Promise<unknown>;
    signMessage: (message: string, redirectPath?: string) => Promise<unknown>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }) {
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

    // Sync local state with SDK state
    useEffect(() => {
        if (sdkWallet?.smartWallet) {
            setLocalWallet({ smartWallet: sdkWallet.smartWallet });
        }
    }, [sdkWallet?.smartWallet]);

    const wallet = localWallet || sdkWallet;
    const isConnected = sdkIsConnected && !!wallet?.smartWallet;

    // Simplified connect - just pass a path, we handle the URL
    const handleConnect = useCallback(async (redirectPath: string = '') => {
        setConnecting(true);
        try {
            await connect({
                redirectUrl: Linking.createURL(redirectPath),
                onSuccess: (connectedWallet) => {
                    setConnecting(false);
                    setLocalWallet({ smartWallet: connectedWallet.smartWallet });
                },
                onFail: (error) => {
                    setConnecting(false);
                    Alert.alert('Connection Failed', error.message);
                },
            });
        } catch (error) {
            setConnecting(false);
            Alert.alert('Connection Error', error.message);
        }
    }, [connect]);

    // Simplified signAndSendTransaction - handles redirect URL automatically
    const handleSignAndSend = useCallback(
        async (payload, redirectPath: string = '') => {
            return signAndSendTransaction(payload, {
                redirectUrl: Linking.createURL(redirectPath),
            });
        },
        [signAndSendTransaction]
    );

    return (
        <WalletContext.Provider value={{
            wallet,
            isConnected,
            connecting,
            connect: handleConnect,
            disconnect: handleDisconnect,
            signAndSendTransaction: handleSignAndSend,
            signMessage: handleSignMessage,
        }}>
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
```

### Benefits of This Pattern

| Direct SDK Usage | With WalletContext |
|------------------|-------------------|
| `connect({ redirectUrl: Linking.createURL('path'), onSuccess: ..., onFail: ... })` | `connect('path')` |
| `signAndSendTransaction(payload, { redirectUrl: Linking.createURL('path') })` | `signAndSendTransaction(payload, 'path')` |
| Manual state management | Shared state across all screens |
| Manual error handling | Consistent Alert-based errors |
| No `connecting` state | Built-in `connecting` boolean |

### Usage with useLazorkitWalletConnect Hook

For convenience, we also provide a simple hook wrapper:

```typescript
// hooks/useLazorkitWalletConnect.ts
import { useWalletContext } from '@/contexts/WalletContext';

export function useLazorkitWalletConnect() {
    return useWalletContext();
}
```

### In Your Components

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

function MyScreen() {
    const { wallet, isConnected, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();

    const handleConnect = () => {
        // Just pass the return path - context handles the rest
        connect('my-screen');
    };

    const handleTransaction = async () => {
        const signature = await signAndSendTransaction(
            { instructions, transactionOptions: { computeUnitLimit: 200_000 } },
            'my-screen'  // Return path after signing
        );
    };

    return (
        <Button
            title={connecting ? 'Connecting...' : 'Connect'}
            onPress={handleConnect}
            disabled={connecting}
        />
    );
}
```

### When to Use This Pattern

- **Recommended for all mobile apps** using LazorKit
- Multiple screens that need wallet access
- Consistent error handling across the app
- Simpler API without manual redirect URL construction

### Alternative: Using LazorKit SDK Directly

You can skip our wrapper and use the SDK directly:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

function MyScreen() {
    const { wallet, isConnected, connect, signAndSendTransaction } = useWallet();

    const handleConnect = async () => {
        await connect({
            redirectUrl: Linking.createURL('my-screen'),
            onSuccess: (wallet) => console.log('Connected:', wallet.smartWallet),
            onFail: (error) => Alert.alert('Error', error.message),
        });
    };

    const handleTransaction = async () => {
        const signature = await signAndSendTransaction(
            { instructions },
            { redirectUrl: Linking.createURL('my-screen') }
        );
    };
}
```

Both approaches work well. The wrapper is a convenience layer, not a requirement.

---

## Pattern 2: External SDK Integration

### The Challenge

When integrating external Solana SDKs (Raydium, Marinade, Jupiter) on mobile, the same challenges from web apply:

1. **ComputeBudget Instructions**: External SDKs add ComputeBudget instructions that conflict with LazorKit's paymaster
2. **Smart Wallet Validation**: LazorKit requires the wallet address in all instruction account lists

### Our Solution: processInstructionsForLazorKit

This utility works identically on mobile and web:

```typescript
// lib/lazorkit-utils.ts
import { TransactionInstruction, PublicKey } from '@solana/web3.js';

const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111');

export function processInstructionsForLazorKit(
    instructions: TransactionInstruction[],
    smartWalletAddress: string
): TransactionInstruction[] {
    const smartWallet = new PublicKey(smartWalletAddress);

    return instructions
        // Remove ComputeBudget instructions (paymaster handles this)
        .filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM_ID))
        // Add smart wallet to each instruction's accounts
        .map(ix => {
            const hasSmartWallet = ix.keys.some(key => key.pubkey.equals(smartWallet));
            if (!hasSmartWallet) {
                ix.keys.push({
                    pubkey: smartWallet,
                    isSigner: false,
                    isWritable: false,
                });
            }
            return ix;
        });
}
```

### Mobile Usage Example (Raydium Swap)

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { Transaction } from '@solana/web3.js';

function SwapScreen() {
    const { wallet, signAndSendTransaction } = useLazorkitWalletConnect();

    const handleSwap = async () => {
        // 1. Get transaction from Raydium API
        const { data: swapData } = await axios.post(
            'https://api-v3.raydium.io/compute/swap-base-in',
            { /* swap params */ }
        );

        // 2. Deserialize the transaction
        const txBuffer = Buffer.from(swapData.transaction, 'base64');
        const legacyTx = Transaction.from(txBuffer);

        // 3. Process instructions for LazorKit
        const instructions = processInstructionsForLazorKit(
            legacyTx.instructions,
            wallet.smartWallet
        );

        // 4. Send via LazorKit (mobile - with redirect path)
        const signature = await signAndSendTransaction(
            { instructions, transactionOptions: { computeUnitLimit: 600_000 } },
            'examples/03-raydium-swap'  // Return path
        );
    };
}
```

---

## Pattern 3: Balance Management

### useBalances Hook

Same pattern as web, works on mobile:

```typescript
// hooks/useBalances.ts
import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getSolBalance, getUsdcBalance } from '@/lib/solana-utils';

export function useBalances(walletAddress: string | undefined) {
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBalances = useCallback(async () => {
        if (!walletAddress) return;
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
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (walletAddress) fetchBalances();
    }, [walletAddress, fetchBalances]);

    const reset = useCallback(() => {
        setSolBalance(null);
        setUsdcBalance(null);
    }, []);

    return { solBalance, usdcBalance, loading, fetchBalances, reset };
}
```

### Usage

```typescript
const { wallet, isConnected } = useLazorkitWalletConnect();
const { solBalance, usdcBalance, loading, fetchBalances } = useBalances(
    isConnected ? wallet?.smartWallet : null
);

// Pull-to-refresh
<ScrollView
    refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchBalances} />
    }
>
```

---

## Setup: Adding WalletProvider to Your App

Wrap your app with `WalletProvider` inside `LazorKitProvider`:

```typescript
// app/_layout.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from 'expo-router';
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { WalletProvider } from '@/contexts/WalletContext';

export default function RootLayout() {
    return (
        <LazorKitProvider
            rpcUrl="https://api.devnet.solana.com"
            portalUrl="https://portal.lazor.sh"
            configPaymaster={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
        >
            <WalletProvider>
                <Stack />
            </WalletProvider>
        </LazorKitProvider>
    );
}
```

---

## Summary: Mobile vs Web Patterns

| Pattern | Web | Mobile |
|---------|-----|--------|
| Wallet wrapper hook | `useLazorkitWalletConnect` | `useLazorkitWalletConnect` (via WalletContext) |
| Connection | `connect()` (popup) | `connect(redirectPath)` (deep link) |
| Transaction signing | `signAndSendTransaction(payload)` | `signAndSendTransaction(payload, redirectPath)` |
| External SDK integration | `processInstructionsForLazorKit` | Same utility |
| Balance management | `useBalances` | Same hook |

The main difference is **redirect URL handling**. Our `WalletContext` wrapper abstracts this, letting you pass simple paths instead of constructing URLs manually.

---

## Adopting These Patterns

All mobile utilities are in:
- `/mobile/contexts/WalletContext.tsx` - Shared wallet state
- `/mobile/hooks/useLazorkitWalletConnect.ts` - Convenience hook
- `/mobile/hooks/useBalances.ts` - Balance management
- `/mobile/lib/lazorkit-utils.ts` - External SDK integration

You can:
1. **Copy the files directly** into your project
2. **Adapt the patterns** to your specific needs
3. **Use the SDK directly** if you prefer less abstraction

## Next Steps

- [Connect Wallet Example](./04-connect-wallet.md) - Basic connection flow
- [Gasless Transfer Example](./05-gasless-transfer.md) - Send USDC without gas
- [Raydium Swap Example](./06-raydium-swap.md) - External SDK integration
