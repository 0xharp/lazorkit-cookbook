# Example 01: Connect Wallet

Implement passkey-based wallet authentication in React Native with deep linking.

## Overview

This example shows how to:
- Connect a wallet using Face ID / Touch ID
- Handle deep link redirects after authentication
- Display wallet address and balances
- Request devnet airdrops

## Key Concepts

### Deep Linking

Unlike web where LazorKit opens a popup, mobile uses deep links:

```typescript
const APP_SCHEME = 'lazorkitcookbook://';

// Connect with redirect URL
await connect({
  redirectUrl: `${APP_SCHEME}examples/01-connect-wallet`,
  onSuccess: (wallet) => console.log('Connected:', wallet.smartWallet),
  onFail: (error) => Alert.alert('Error', error.message),
});
```

### Wrapper Hook

We create a wrapper hook for cleaner error handling:

```typescript
// hooks/useLazorkitWallet.ts
export function useLazorkitWallet() {
  const { wallet, isConnected, connect, disconnect, signAndSendTransaction } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(async (redirectPath: string = '') => {
    setConnecting(true);
    try {
      await connect({
        redirectUrl: `${APP_SCHEME}${redirectPath}`,
        onSuccess: () => setConnecting(false),
        onFail: (error) => {
          setConnecting(false);
          Alert.alert('Connection Failed', error.message);
        },
      });
    } catch (error) {
      setConnecting(false);
      Alert.alert('Error', error.message);
    }
  }, [connect]);

  return { wallet, isConnected, connecting, connect: handleConnect, ... };
}
```

### Clipboard & External Links

```typescript
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

// Copy address
await Clipboard.setStringAsync(wallet.smartWallet);

// Open explorer
Linking.openURL(`https://explorer.solana.com/address/${address}?cluster=devnet`);
```

## Full Example

See the complete implementation at:
[`mobile/app/examples/01-connect-wallet.tsx`](../../mobile/app/examples/01-connect-wallet.tsx)
