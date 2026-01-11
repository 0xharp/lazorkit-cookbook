# Recipe 01: Passkey Wallet Basics (Mobile)

**Create Solana wallets using Face ID/Touch ID on mobile - no seed phrases, seamless deep link authentication**

This recipe teaches you the fundamentals of LazorKit's passkey authentication on React Native/Expo. By the end, you'll understand how to create wallets using deep links, check balances, and provide a seamless mobile onboarding experience.

> **Environment**: Expo 54 + React Native. For polyfill setup, see [`_layout.tsx`](../../_layout.tsx). For complete setup instructions, refer to the [Mobile Getting Started guide](/docs/mobile/01-getting-started.md).

---

## What You'll Learn

- Create a Solana wallet using WebAuthn (Face ID/Touch ID) via deep links
- Handle the mobile authentication flow with redirects
- Access wallet addresses and public keys
- Check SOL and USDC balances
- Request devnet airdrops for testing
- Disconnect and manage wallet sessions

---

## Prerequisites

Before starting this recipe, make sure you have:

1. LazorKit Mobile SDK installed:
```bash
npm install @lazorkit/wallet-mobile-adapter @solana/web3.js
```

2. Required polyfills for React Native:
```bash
npm install react-native-get-random-values react-native-url-polyfill buffer
```

3. Expo Linking configured for deep links (see [Deep Link Setup](#deep-link-setup))

---

## Mobile vs Web: Key Differences

| Aspect | Web | Mobile |
|--------|-----|--------|
| Authentication | Popup window | Deep link to portal |
| Return flow | Popup closes automatically | Redirect back to app |
| SDK | `@lazorkit/wallet` | `@lazorkit/wallet-mobile-adapter` |
| Connect call | `connect()` | `connect(redirectPath)` |

---

## Step 1: Set Up Polyfills

React Native requires polyfills for crypto and URL handling. Add these at the very top of your root layout:

```typescript
// app/_layout.tsx
// Polyfills - MUST be at the very top before any other imports
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
```

---

## Step 2: Configure the LazorKit Provider

The mobile provider requires an `appScheme` for deep link handling:

```typescript
// providers/LazorkitProvider.tsx
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { ReactNode } from 'react';
import * as Linking from 'expo-linking';

const APP_SCHEME = 'lazorkitcookbook';

export function LazorkitProvider({ children }: { children: ReactNode }) {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
      appScheme={APP_SCHEME}
    >
      {children}
    </LazorKitProvider>
  );
}
```

---

## Step 3: Set Up Deep Link Handling

Create a custom hook to manage wallet connection with deep links:

```typescript
// hooks/useLazorkitWallet.ts
import { useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const APP_SCHEME = 'lazorkitcookbook';

export function useLazorkitWallet() {
  const { wallet, isConnected, connect: sdkConnect, disconnect, signAndSendTransaction } = useWallet();

  // Handle deep link returns from LazorKit portal
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      // LazorKit SDK handles the URL parsing internally
      console.log('Deep link received:', event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Wrap connect to include redirect URL
  const connect = useCallback((returnPath?: string) => {
    const redirectUrl = Linking.createURL(returnPath || '');
    sdkConnect({ redirectUrl });
  }, [sdkConnect]);

  return {
    wallet,
    isConnected,
    connect,
    disconnect,
    signAndSendTransaction,
    connecting: false, // SDK doesn't expose this yet
  };
}
```

---

## Step 4: Connect with Passkey Authentication

Use the custom hook to trigger authentication:

```typescript
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';

export default function WalletScreen() {
  const { wallet, isConnected, connect, connecting } = useLazorkitWallet();

  const handleConnect = () => {
    // Pass the return path for deep link redirect
    connect('examples/01-connect-wallet');
  };

  return (
    <TouchableOpacity onPress={handleConnect} disabled={connecting}>
      <Text>{connecting ? 'Creating Wallet...' : 'Create Wallet with Passkey'}</Text>
    </TouchableOpacity>
  );
}
```

**What happens when `connect()` is called on mobile:**
1. App opens the LazorKit portal in the system browser
2. User authenticates with Face ID, Touch ID, or security key
3. Portal redirects back to your app via deep link
4. SDK processes the response and populates the wallet object

---

## Step 5: Access Wallet Information

Once connected, access the wallet address via `wallet.smartWallet`:

```typescript
{isConnected && wallet && (
  <View>
    <Text>Connected!</Text>
    <Text>Wallet: {wallet.smartWallet}</Text>

    {/* Copy address to clipboard */}
    <TouchableOpacity onPress={async () => {
      await Clipboard.setStringAsync(wallet.smartWallet);
      Alert.alert('Copied', 'Address copied to clipboard');
    }}>
      <Text>Copy Address</Text>
    </TouchableOpacity>

    {/* View on Explorer */}
    <TouchableOpacity onPress={() => {
      Linking.openURL(`https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`);
    }}>
      <Text>View on Explorer</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## Step 6: Fetch Token Balances

Use the `useBalances` hook to automatically fetch and manage SOL and USDC balances:

```typescript
import { useBalances } from '@/hooks/useBalances';

export default function WalletScreen() {
  const { wallet, isConnected } = useLazorkitWallet();

  // Automatically fetches balances when wallet connects
  const { solBalance, usdcBalance, loading, fetchBalances } = useBalances(
    isConnected ? wallet?.smartWallet : null
  );

  return (
    <View>
      <Text>SOL: {solBalance?.toFixed(4) ?? 'Loading...'}</Text>
      <Text>USDC: {usdcBalance?.toFixed(2) ?? 'Loading...'}</Text>

      <TouchableOpacity onPress={fetchBalances} disabled={loading}>
        <Text>{loading ? 'Refreshing...' : 'Refresh Balances'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

You can also use pull-to-refresh:

```typescript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={loading}
      onRefresh={fetchBalances}
      tintColor="#a855f7"
    />
  }
>
  {/* Content */}
</ScrollView>
```

---

## Step 7: Request Devnet Airdrops

For testing, request SOL from the devnet faucet:

```typescript
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-utils';

const handleAirdrop = async () => {
  if (!wallet?.smartWallet) return;

  try {
    const connection = getConnection();
    const publicKey = new PublicKey(wallet.smartWallet);

    const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);

    Alert.alert('Success', 'Airdrop successful! You received 1 SOL');
    await fetchBalances();
  } catch (error) {
    Alert.alert(
      'Airdrop Failed',
      'Devnet faucets have rate limits. Try faucet.solana.com directly.'
    );
  }
};
```

---

## Step 8: Disconnect Wallet

Allow users to disconnect their wallet:

```typescript
<TouchableOpacity onPress={disconnect}>
  <Text>Disconnect Wallet</Text>
</TouchableOpacity>
```

---

## Complete Example

The complete implementation uses the centralized hooks and utilities for clean, maintainable code.

**Custom Hooks Used:**

| Hook | Description |
|------|-------------|
| `useLazorkitWallet()` | Handles wallet connection with deep link flow |
| `useBalances()` | Fetches and manages SOL/USDC balances automatically |

**Utility Functions:**

| Function | Description |
|----------|-------------|
| `getConnection()` | Returns a cached Solana connection instance |
| `shortenAddress()` | Truncates addresses for display |

**Key Pattern - Mobile Wallet Connection:**

```typescript
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
import { useBalances } from '@/hooks/useBalances';

export default function WalletScreen() {
  const { wallet, isConnected, connect } = useLazorkitWallet();

  const { solBalance, usdcBalance, fetchBalances } = useBalances(
    isConnected ? wallet?.smartWallet : null
  );

  const handleConnect = () => {
    connect('examples/01-connect-wallet'); // Return path for deep link
  };

  return (
    <TouchableOpacity onPress={handleConnect}>
      <Text>Connect with Passkey</Text>
    </TouchableOpacity>
  );
}
```

> **Source**: See the full implementation at [`index.tsx`](index.tsx)

---

## Key Concepts

### WebAuthn Passkey Authentication
Instead of seed phrases, LazorKit uses WebAuthn (the same technology behind Face ID login). Your private keys are stored securely in your device's secure enclave and never leave your device.

### Deep Link Flow (Mobile-Specific)
On mobile, authentication happens via the system browser:
1. Your app opens `portal.lazor.sh` with your app's scheme
2. User authenticates with biometrics in the browser
3. Portal redirects back using your custom URL scheme (e.g., `lazorkitcookbook://`)
4. Your app receives the wallet data via the deep link handler

### Smart Wallet
When you create a wallet, LazorKit generates a smart wallet address on Solana. This is a regular Solana address that can:
- Receive SOL and SPL tokens
- Interact with any Solana program
- Sign transactions using your biometrics

---

## Deep Link Setup

### Expo Configuration

Add your app scheme to `app.json`:

```json
{
  "expo": {
    "scheme": "lazorkitcookbook",
    "ios": {
      "bundleIdentifier": "com.yourcompany.lazorkitcookbook"
    },
    "android": {
      "package": "com.yourcompany.lazorkitcookbook"
    }
  }
}
```

### Testing Deep Links

```bash
# iOS Simulator
npx uri-scheme open "lazorkitcookbook://examples/01-connect-wallet" --ios

# Android Emulator
npx uri-scheme open "lazorkitcookbook://examples/01-connect-wallet" --android
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Deep link not working | Verify scheme in `app.json`, rebuild the app |
| Redirect fails | Ensure `expo-linking` is properly configured |
| Balance shows 0 | The token account may not exist yet (created on first transfer) |
| Airdrop fails | Devnet faucets have rate limits - wait or use external faucets |
| Polyfill errors | Ensure polyfills are imported at the very top of `_layout.tsx` |

---

## Next Steps

Now that you understand mobile wallet basics, proceed to:

- **[Recipe 02: Gasless USDC Transfer](../02-gasless-transfer/README.md)** - Learn how to send tokens without paying gas fees!
- **[Recipe 03: Gasless Raydium Swap](../03-raydium-swap/README.md)** - Swap tokens on Raydium DEX without gas fees!

---

## Resources

- [LazorKit Mobile SDK Docs](https://docs.lazorkit.com/mobile-sdk/getting-started)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [WebAuthn Specification](https://webauthn.guide/)
