# Example: Connect Wallet

Implement passkey-based wallet authentication in React Native with deep linking.

## Overview

This example shows how to:
- Connect a wallet using Face ID / Touch ID
- Handle deep link redirects after authentication
- Display wallet address and balances
- Request devnet airdrops

## Using the Cookbook's WalletContext

This cookbook provides a `WalletContext` wrapper that simplifies the LazorKit SDK API. Instead of manually constructing redirect URLs, you just pass a path:

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

function ConnectScreen() {
    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();

    const handleConnect = () => {
        // Just pass the return path - WalletContext handles redirectUrl
        connect('examples/01-connect-wallet');
    };

    if (connecting) {
        return <Text>Connecting...</Text>;
    }

    if (isConnected) {
        return (
            <View>
                <Text>Connected: {wallet?.smartWallet}</Text>
                <Button title="Disconnect" onPress={disconnect} />
            </View>
        );
    }

    return <Button title="Connect" onPress={handleConnect} />;
}
```

## Using LazorKit SDK Directly

You can also use the SDK without our wrapper:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

function ConnectScreen() {
    const { wallet, isConnected, connect, disconnect } = useWallet();
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        await connect({
            redirectUrl: Linking.createURL('examples/01-connect-wallet'),
            onSuccess: (connectedWallet) => {
                setConnecting(false);
                console.log('Connected:', connectedWallet.smartWallet);
            },
            onFail: (error) => {
                setConnecting(false);
                Alert.alert('Connection Failed', error.message);
            },
        });
    };

    // ... rest of component
}
```

## Key Concepts

### Deep Linking

Unlike web where LazorKit opens a popup, mobile uses deep links:

1. Your app calls `connect()` with a `redirectUrl`
2. External browser opens to LazorKit portal
3. User authenticates with Face ID/Touch ID
4. Browser redirects back to your app via deep link
5. `onSuccess` callback fires with wallet data

### Clipboard & External Links

```typescript
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

// Copy address to clipboard
await Clipboard.setStringAsync(wallet.smartWallet);
Alert.alert('Copied', 'Address copied to clipboard');

// Open Solana Explorer
Linking.openURL(
    `https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`
);
```

### Balance Display with Pull-to-Refresh

```typescript
import { useBalances } from '@/hooks/useBalances';

const { solBalance, usdcBalance, loading, fetchBalances } = useBalances(
    isConnected ? wallet?.smartWallet : null
);

<ScrollView
    refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchBalances} />
    }
>
    <Text>SOL: {solBalance?.toFixed(4)}</Text>
    <Text>USDC: {usdcBalance?.toFixed(2)}</Text>
</ScrollView>
```

## Full Example

See the complete implementation at:
[`mobile/app/examples/01-connect-wallet/index.tsx`](../../mobile/app/examples/01-connect-wallet/index.tsx)

## Next Steps

- [Gasless Transfer](./05-gasless-transfer.md) - Send USDC without gas fees
- [Raydium Swap](./06-raydium-swap.md) - DEX integration
