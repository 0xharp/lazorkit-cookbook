# LazorKit Mobile SDK Basics

This guide covers the core concepts of the LazorKit Mobile SDK and how it differs from the web SDK.

## The Mobile SDK

```bash
npm install @lazorkit/wallet-mobile-adapter
```

The mobile SDK provides the same core functionality as web:
- Passkey-based wallet creation
- Gasless transaction sending via paymaster
- Smart wallet management

But the **authentication flow is different** due to mobile platform constraints.

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
            {/* Your app */}
        </LazorKitProvider>
    );
}
```

## The useWallet Hook

The core hook provides:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';

const {
    wallet,                  // { smartWallet: string } | null
    isConnected,             // boolean
    connect,                 // (options) => Promise
    disconnect,              // (options) => Promise
    signAndSendTransaction,  // (payload, options) => Promise<signature>
    signMessage,             // (message, options) => Promise
} = useWallet();
```

## Key Difference: Deep Linking

### Web SDK (Popup)
```typescript
// Web - simple, no redirect needed
await connect();
await signAndSendTransaction({ instructions });
```

### Mobile SDK (Deep Link)
```typescript
import * as Linking from 'expo-linking';

// Mobile - requires redirectUrl for every operation
await connect({
    redirectUrl: Linking.createURL('your/return/path'),
    onSuccess: (wallet) => console.log('Connected:', wallet.smartWallet),
    onFail: (error) => console.error('Failed:', error.message),
});

await signAndSendTransaction(
    { instructions },
    { redirectUrl: Linking.createURL('your/return/path') }
);
```

### Why Deep Links?

On mobile, passkey authentication cannot happen in an embedded webview. The flow is:

1. **Your app calls `connect()`** → Opens external browser
2. **User authenticates** → Face ID/Touch ID in LazorKit portal
3. **Browser redirects back** → Your app receives the wallet data via deep link

This is why every operation needs a `redirectUrl` - so the browser knows where to return.

## Authentication Flow Diagram

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Your App   │────▶│  External       │────▶│  LazorKit    │
│              │     │  Browser        │     │  Portal      │
└──────────────┘     └─────────────────┘     └──────────────┘
       ▲                                            │
       │              Deep Link Redirect            │
       └────────────────────────────────────────────┘
                   (with wallet data)
```

## Connect Options

```typescript
await connect({
    // Required: Where to return after authentication
    redirectUrl: Linking.createURL('examples/01-connect-wallet'),

    // Callbacks
    onSuccess: (wallet) => {
        // wallet.smartWallet contains the address
        console.log('Connected:', wallet.smartWallet);
    },
    onFail: (error) => {
        // error.message contains the reason
        Alert.alert('Failed', error.message);
    },
});
```

## Transaction Options

```typescript
const signature = await signAndSendTransaction(
    {
        // The transaction payload
        instructions: [...],
        transactionOptions: {
            computeUnitLimit: 200_000,  // Optional: default is handled by paymaster
        },
    },
    {
        // Required: Where to return after signing
        redirectUrl: Linking.createURL('examples/02-transfer'),
    }
);
```

## Disconnect

```typescript
await disconnect({
    onSuccess: () => {
        console.log('Disconnected');
    },
    onFail: (error) => {
        Alert.alert('Error', error.message);
    },
});
```

## URL Scheme Configuration

For deep links to work, configure your app's URL scheme in `app.json`:

```json
{
    "expo": {
        "scheme": "lazorkitcookbook",
        "name": "LazorKit Cookbook"
    }
}
```

Then use `Linking.createURL()` to generate redirect URLs:

```typescript
import * as Linking from 'expo-linking';

// Creates: lazorkitcookbook://examples/01-connect-wallet
const redirectUrl = Linking.createURL('examples/01-connect-wallet');
```

## Comparison: Web vs Mobile SDK

| Feature | Web SDK | Mobile SDK |
|---------|---------|------------|
| **Package** | `@lazorkit/wallet` | `@lazorkit/wallet-mobile-adapter` |
| **Auth method** | Popup window | External browser + deep link |
| **`connect()`** | `connect()` | `connect({ redirectUrl, onSuccess, onFail })` |
| **`signAndSendTransaction()`** | `signAndSendTransaction(payload)` | `signAndSendTransaction(payload, { redirectUrl })` |
| **User flow** | Stays in app | Leaves app, returns via deep link |
| **State persistence** | Automatic | May need local state sync |

## Best Practices

### 1. Handle State After Deep Link Return

When returning from authentication, your component may re-mount. Sync SDK state to local state:

```typescript
const [localWallet, setLocalWallet] = useState(null);

useEffect(() => {
    if (sdkWallet?.smartWallet) {
        setLocalWallet(sdkWallet);
    }
}, [sdkWallet?.smartWallet]);
```

### 2. Provide Meaningful Return Paths

Use specific paths so the user returns to the right screen:

```typescript
// Good - returns to the specific screen
connect('examples/02-gasless-transfer');

// Avoid - might confuse navigation state
connect('');
```

### 3. Show Loading States

Deep link operations take time. Always show feedback:

```typescript
const [connecting, setConnecting] = useState(false);

const handleConnect = async () => {
    setConnecting(true);
    await connect({
        redirectUrl: Linking.createURL('home'),
        onSuccess: () => setConnecting(false),
        onFail: () => setConnecting(false),
    });
};

return (
    <Button
        title={connecting ? 'Connecting...' : 'Connect'}
        disabled={connecting}
        onPress={handleConnect}
    />
);
```

## Next Steps

- [Cookbook Patterns](./03-cookbook-patterns.md) - WalletContext wrapper for simplified API
- [Connect Wallet Example](./04-connect-wallet.md) - Complete implementation
- [Gasless Transfer Example](./05-gasless-transfer.md) - Send USDC without gas
- [Raydium Swap Example](./06-raydium-swap.md) - External SDK integration
