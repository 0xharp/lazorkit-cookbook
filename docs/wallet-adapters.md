# Wallet Adapter Integration

This guide explains how to use LazorKit alongside other Solana wallets like Phantom and Solflare.

## Why Multi-Wallet Support?

| User Type | Experience |
|-----------|------------|
| **New users** | Onboard instantly with passkeys (no extension needed) |
| **Existing crypto users** | Connect their preferred wallet |
| **LazorKit users** | Still get gasless transactions via paymaster |

## Supported Adapters

The cookbook demonstrates integration with four popular adapters:

| Adapter | Package | Description |
|---------|---------|-------------|
| Anza Wallet Adapter | `@solana/wallet-adapter-react` | Industry standard |
| ConnectorKit | `@solana/connector` | Solana Foundation's latest |
| Wallet-UI | `@wallet-ui/react` | Modern, headless components |
| Jupiter Unified Wallet Kit | `@jup-ag/wallet-adapter` | Used by Jupiter & Meteora |

## Key Concept: Wallet Registration

LazorKit registers itself as a wallet-standard compatible wallet. This makes it appear alongside other wallets in any compatible adapter.

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

After registration, LazorKit appears in the wallet selection modal.

## Quick Setup Examples

### Anza Wallet Adapter

```typescript
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
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

When connected via LazorKit, users automatically get gasless transactions. No code changes needed - the paymaster handles it.

```typescript
// Same code works for all wallets
const signature = await sendTransaction(transaction, connection);

// If connected via LazorKit: gasless
// If connected via Phantom: user pays SOL
```

## Live Demo

See Example 05 for complete implementations:

- [Anza Adapter](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/anza-adapter)
- [ConnectorKit](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/connectorkit)
- [Wallet-UI](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/wallet-ui)
- [Jupiter Unified](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration/unified-wallet-kit)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| LazorKit not appearing | Ensure `registerLazorkitWallet()` is called before provider mounts |
| Popup blocked | Allow popups for the site in browser settings |
| "Wallet not connected" | Ensure user has selected a wallet from the modal |

## Resources

- [Example 05 README](../examples/05-wallet-adapter-integration/README.md)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [LazorKit Docs](https://docs.lazorkit.com/)
