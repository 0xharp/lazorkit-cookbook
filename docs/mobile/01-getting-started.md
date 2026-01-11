# Getting Started with LazorKit Mobile SDK

This guide covers setting up LazorKit in a React Native app built with Expo.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

## Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
```

### Required Dependencies

```bash
# Polyfills for Solana Web3.js
npm install react-native-get-random-values react-native-url-polyfill buffer

# Expo packages
npm install expo-web-browser expo-linking expo-clipboard
```

## Polyfills Setup

Add these imports at the **very top** of your entry file (before any other imports):

```typescript
// app/_layout.tsx or App.tsx

// Must be at the very top!
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

// Then your other imports...
import { Stack } from 'expo-router';
```

## Provider Setup

Wrap your app with `LazorKitProvider`:

```typescript
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      <Stack />
    </LazorKitProvider>
  );
}
```

## Deep Linking Configuration

Add a URL scheme to `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "name": "My App",
    ...
  }
}
```

This scheme is used for authentication callbacks:

```typescript
const { connect } = useWallet();

await connect({
  redirectUrl: 'myapp://home'  // Must match your scheme
});
```

## Basic Usage

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { Button, Text, View } from 'react-native';

function WalletScreen() {
  const { wallet, isConnected, connect, disconnect, signAndSendTransaction } = useWallet();

  if (!isConnected) {
    return (
      <Button
        title="Connect Wallet"
        onPress={() => connect({ redirectUrl: 'myapp://home' })}
      />
    );
  }

  return (
    <View>
      <Text>Connected: {wallet?.smartWallet}</Text>
      <Button title="Disconnect" onPress={() => disconnect()} />
    </View>
  );
}
```

## Key Differences from Web SDK

| Feature | Web SDK | Mobile SDK |
|---------|---------|------------|
| Package | `@lazorkit/wallet` | `@lazorkit/wallet-mobile-adapter` |
| Authentication | Popup window | Deep link redirect |
| `connect()` | `connect()` | `connect({ redirectUrl: 'scheme://path' })` |
| `signAndSendTransaction()` | No redirect needed | Requires `{ redirectUrl }` option |

## Next Steps

- [Cookbook Patterns](./03-cookbook-patterns.md) - WalletContext wrapper & utilities
- [Connect Wallet Example](./04-connect-wallet.md)
- [Gasless Transfer Example](./05-gasless-transfer.md)
- [Raydium Swap Example](./06-raydium-swap.md)
