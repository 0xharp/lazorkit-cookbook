# Wallet Adapter Integration

This guide shows how to use LazorKit alongside other Solana wallets like Phantom and Solflare.

## Why Multi-Wallet Support?

Give your users the best of both worlds:

| User Type | Experience |
|-----------|------------|
| **New users** | Onboard instantly with passkeys (no extension needed) |
| **Existing crypto users** | Connect their preferred wallet |
| **All LazorKit users** | Get gasless transactions automatically |

## Supported Adapters

The cookbook demonstrates integration with four popular adapters:

| Adapter | Package | Best For |
|---------|---------|----------|
| Anza Wallet Adapter | `@solana/wallet-adapter-react` | Industry standard, most documentation |
| ConnectorKit | `@solana/connector` | Solana Foundation's latest approach |
| Wallet-UI | `@wallet-ui/react` | Modern, headless components |
| Jupiter Unified Wallet Kit | `@jup-ag/wallet-adapter` | Used by Jupiter & Meteora |

## How It Works

LazorKit registers itself as a wallet-standard compatible wallet. After registration, it appears alongside other wallets in any compatible adapter.

```typescript
import { registerLazorkitWallet } from '@lazorkit/wallet';

useEffect(() => {
  registerLazorkitWallet({
    rpcUrl: 'https://api.devnet.solana.com',
    portalUrl: 'https://portal.lazor.sh',
    paymasterConfig: {
      paymasterUrl: 'https://kora.devnet.lazorkit.com',
    },
  });
}, []);
```

## Quick Setup Examples

### Anza Wallet Adapter

```typescript
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const wallets = useMemo(() => [], []);  // Empty - wallet-standard handles discovery

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <WalletMultiButton />
          <YourComponent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### ConnectorKit

```typescript
import { AppProvider, useConnector } from '@solana/connector/react';
import { getDefaultConfig } from '@solana/connector/headless';

const config = useMemo(() => getDefaultConfig({
  appName: 'My App',
  network: 'devnet',
}), []);

<AppProvider connectorConfig={config}>
  <ConnectButton />
  <YourComponent />
</AppProvider>
```

### Jupiter Unified Wallet Kit

```typescript
import { UnifiedWalletProvider, UnifiedWalletButton } from '@jup-ag/wallet-adapter';

<ConnectionProvider endpoint={RPC_URL}>
  <UnifiedWalletProvider
    wallets={[]}
    config={{
      autoConnect: true,
      env: 'devnet',
      theme: 'dark',
    }}
  >
    <UnifiedWalletButton />
    <YourComponent />
  </UnifiedWalletProvider>
</ConnectionProvider>
```

## Gasless Detection

When users connect via LazorKit, they automatically get gasless transactions. Your code stays the same:

```typescript
// Same code works for all wallets
const signature = await sendTransaction(transaction, connection);

// If connected via LazorKit: gasless (paymaster covers fees)
// If connected via Phantom: user pays SOL for gas
```

No code changes needed - the paymaster handles everything behind the scenes.

## Live Demo

See Example 05 for complete implementations:

- [Anza Adapter](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/anza-adapter)
- [ConnectorKit](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/connectorkit)
- [Wallet-UI](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/wallet-ui)
- [Jupiter Unified](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/unified-wallet-kit)

## Common Questions

| Question | Answer |
|----------|--------|
| Does LazorKit appear automatically? | Yes, after calling `registerLazorkitWallet()` |
| Do I need to change my transaction code? | No, gasless works automatically for LazorKit users |
| What if users block popups? | Show a message asking them to allow popups |

## Resources

- [Example 05 README](../app/app/examples/05-wallet-adapter-integration/README.md) - Full implementation details for all adapters
- [Live Demo - Anza Adapter](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/anza-adapter)
- [Live Demo - ConnectorKit](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/connectorkit)
- [Live Demo - Wallet-UI](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/wallet-ui)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [LazorKit Docs](https://docs.lazorkit.com/)
