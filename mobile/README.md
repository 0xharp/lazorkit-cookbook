# LazorKit Cookbook - Mobile (React Native / Expo)

Mobile examples demonstrating LazorKit SDK integration for React Native apps built with Expo.

## Examples

| # | Example | Description |
|---|---------|-------------|
| 01 | [Connect Wallet](./app/examples/01-connect-wallet.tsx) | Passkey authentication with deep linking |
| 02 | [Gasless Transfer](./app/examples/02-gasless-transfer.tsx) | USDC transfers without gas fees |
| 03 | [Raydium Swap](./app/examples/03-raydium-swap.tsx) | DEX swaps powered by Raydium |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Key Differences from Web

### Deep Linking

Mobile uses deep links for authentication callbacks instead of popup windows:

```typescript
// App scheme defined in app.json
const APP_SCHEME = 'lazorkitcookbook://';

// Connect with redirect
await connect({ redirectUrl: `${APP_SCHEME}examples/01-connect-wallet` });
```

### Polyfills

React Native requires polyfills for Solana Web3.js. These are imported at the top of `app/_layout.tsx`:

```typescript
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
```

### UI Components

- `TextInput` instead of HTML `<input>`
- `Alert.alert()` instead of browser `alert()`
- `Linking.openURL()` for external links
- `Clipboard` API from `expo-clipboard`

## Project Structure

```
mobile/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout + polyfills + provider
│   ├── index.tsx               # Home screen
│   └── examples/
│       ├── _layout.tsx         # Examples stack layout
│       ├── 01-connect-wallet.tsx
│       ├── 02-gasless-transfer.tsx
│       └── 03-raydium-swap.tsx
├── components/                 # Reusable UI components
├── hooks/                      # Custom hooks
├── lib/                        # Utilities (shared with web)
└── providers/                  # Context providers
```

## SDK Reference

See the [LazorKit React Native SDK documentation](https://docs.lazor.sh) for full API reference.

```typescript
import { LazorKitProvider, useWallet } from '@lazorkit/wallet-mobile-adapter';

const { wallet, isConnected, connect, disconnect, signAndSendTransaction } = useWallet();
```
