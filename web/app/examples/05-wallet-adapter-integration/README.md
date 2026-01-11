# Recipe 05: Wallet Adapter Integration

**Use LazorKit alongside Phantom, Solflare, and other wallets - best of both worlds**

This recipe demonstrates how to integrate LazorKit with popular Solana wallet adapter libraries. Users can choose between passkey authentication (LazorKit) or their existing wallets, while LazorKit users still enjoy gasless transactions.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Register LazorKit as a wallet-standard compatible wallet
- Integrate with three popular wallet adapter libraries
- Build a gasless transfer that works with any connected wallet
- Use shared hooks and utilities across different adapters
- Understand the wallet-standard protocol

---

## Why Wallet Adapter Integration?

While LazorKit provides an excellent standalone experience, many users prefer their existing wallets:

| User Type | Experience |
|-----------|------------|
| **New users** | Onboard instantly with passkeys (no extension needed) |
| **Existing crypto users** | Connect their preferred wallet (Phantom, Solflare, etc.) |
| **LazorKit users** | Still get gasless transactions via paymaster |

**The key insight**: LazorKit can be registered as a wallet-standard wallet, making it appear alongside other wallets in any compatible adapter.

---

## Supported Adapters

This recipe includes examples for four popular wallet adapters:

| Adapter | Package | Description                            |
|---------|---------|----------------------------------------|
| **Anza Wallet Adapter** | `@solana/wallet-adapter-react` | Industry standard, built-in modal UI   |
| **ConnectorKit** | `@solana/connector` | Solana Foundation's latest official package |
| **Wallet-UI** | `@wallet-ui/react` | Modern, headless/unstyled components   |
| **Jupiter Unified Wallet Kit** | `@jup-ag/wallet-adapter` | Feature-rich adapter used by Jupiter & Meteora |

Each example demonstrates the same gasless USDC transfer functionality.

---

## Project Structure

```
05-wallet-adapter-integration/
├── page.tsx                    # Adapter selection page
├── layout.tsx                  # Shared layout (registers LazorKit)
├── anza-adapter/
│   └── page.tsx                # Anza Wallet Adapter demo
├── connectorkit/
│   └── page.tsx                # ConnectorKit demo
├── wallet-ui/
│   └── page.tsx                # Wallet-UI demo
├── unified-wallet-kit/
│   └── page.tsx                # Jupiter Unified Wallet Kit demo
└── README.md                   # This tutorial
```

---

## Step 1: Register LazorKit as a Wallet

The key to integration is registering LazorKit so wallet adapters can discover it:

```typescript
// layout.tsx
'use client';

import { useEffect } from 'react';
import { registerLazorkitWallet } from '@lazorkit/wallet';

export default function Layout({ children }) {
  useEffect(() => {
    // Register LazorKit as a wallet-standard wallet
    registerLazorkitWallet({
      rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      portalUrl: 'https://portal.lazor.sh',
      paymasterConfig: {
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
      },
      clusterSimulation: 'devnet',
    });
  }, []);

  return <>{children}</>;
}
```

After registration, LazorKit appears alongside Phantom, Solflare, and other installed wallets in the wallet modal.

---

## Step 2: Choose Your Adapter

### Option A: Anza Wallet Adapter

The most widely used adapter in the Solana ecosystem.

```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @lazorkit/wallet
```

```typescript
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  // Empty array - wallet-standard handles discovery
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <WalletMultiButton />  {/* LazorKit appears here! */}
          <YourComponent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### Option B: ConnectorKit

Solana Foundation's latest official connector with minimal bundle size.

```bash
npm install @solana/connector @lazorkit/wallet
```

```typescript
import { AppProvider, useConnector, useAccount } from '@solana/connector/react';
import { useTransactionSigner } from '@solana/connector';
import { getDefaultConfig } from '@solana/connector/headless';

function App() {
  const config = useMemo(() => getDefaultConfig({
    appName: 'My App',
    network: 'devnet',
  }), []);

  return (
    <AppProvider connectorConfig={config}>
      <ConnectButton />  {/* LazorKit appears here! */}
      <YourComponent />
    </AppProvider>
  );
}
```

### Option C: Wallet-UI

Modern, headless components with gill transaction building.

```bash
npm install @wallet-ui/react gill @lazorkit/wallet
```

```typescript
import { WalletUi, WalletUiDropdown, useWalletUi } from '@wallet-ui/react';
import { createSolanaDevnet, createWalletUiConfig } from '@wallet-ui/react';

const config = createWalletUiConfig({
  clusters: [createSolanaDevnet()],
});

function App() {
  return (
    <WalletUi config={config}>
      <WalletUiDropdown />  {/* LazorKit appears here! */}
      <YourComponent />
    </WalletUi>
  );
}
```

### Option D: Jupiter Unified Wallet Kit

The "Swiss Army Knife" wallet adapter used by Jupiter and Meteora in production.

```bash
npm install @jup-ag/wallet-adapter @lazorkit/wallet
```

```typescript
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider, UnifiedWalletButton } from '@jup-ag/wallet-adapter';

const RPC_URL = 'https://api.devnet.solana.com';

function App() {
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: 'devnet',
          metadata: {
            name: 'My App',
            description: 'My Solana dApp',
            url: 'https://myapp.com',
            iconUrls: ['https://myapp.com/icon.png'],
          },
          theme: 'dark',  // 'light', 'dark', or 'jupiter'
        }}
      >
        <UnifiedWalletButton />  {/* LazorKit appears here! */}
        <YourComponent />
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}
```

**Key Features:**
- Built-in themes (Light, Dark, Jupiter)
- Mobile Wallet Adapter support
- Auto-reconnect functionality
- Battle-tested by Jupiter & Meteora

---

## Step 3: Build the Transfer Form

All examples use shared hooks and utilities for consistent behavior:

```typescript
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';
import {
  validateRecipientAddress,
  validateTransferAmount,
  buildUsdcTransferInstructions,
  createTransferSuccessMessage,
  withRetry,
  formatTransactionError,
} from '@/lib/solana-utils';
```

### Shared Hooks

| Hook | Description |
|------|-------------|
| `useBalances(address)` | Fetches SOL/USDC balances, auto-updates on connect |
| `useTransferForm()` | Manages form state (recipient, amount, sending, retryCount) |

### Shared Utilities

| Function | Description |
|----------|-------------|
| `validateRecipientAddress()` | Returns `{ valid, address?, error? }` |
| `validateTransferAmount()` | Returns `{ valid, amountNum?, error? }` |
| `buildUsdcTransferInstructions()` | Builds transfer with automatic ATA creation |
| `createTransferSuccessMessage()` | Consistent success message format |
| `withRetry()` | Retry logic with exponential backoff |
| `formatTransactionError()` | User-friendly error messages |

---

## Step 4: Handle the Transfer

The transfer logic is similar across all adapters:

```typescript
const handleSend = async () => {
  // 1. Validate inputs
  const recipientValidation = validateRecipientAddress(recipient);
  if (!recipientValidation.valid) {
    alert(recipientValidation.error);
    return;
  }

  const amountValidation = validateTransferAmount(amount, usdcBalance);
  if (!amountValidation.valid) {
    alert(amountValidation.error);
    return;
  }

  startSending();

  try {
    const signature = await withRetry(
      async () => {
        // Build instructions
        const instructions = await buildUsdcTransferInstructions(
          connection,
          publicKey,
          recipientValidation.address!,
          amountValidation.amountNum!
        );

        // Send via adapter (syntax varies slightly by adapter)
        return await sendTransaction(transaction, connection);
      },
      {
        maxRetries: 3,
        onRetry: (attempt) => setRetryCount(attempt)
      }
    );

    setLastTxSignature(signature);
    alert(createTransferSuccessMessage(amountValidation.amountNum!, recipient));
    resetForm();
    await fetchBalances();
  } catch (err) {
    alert(formatTransactionError(err, 'Transfer'));
  } finally {
    stopSending();
  }
};
```

---

## Adapter-Specific Differences

While the core logic is shared, each adapter has slight differences:

### Anza Wallet Adapter

```typescript
const { publicKey, sendTransaction } = useWallet();

// Build transaction
const transaction = new Transaction({ feePayer: publicKey, blockhash, lastValidBlockHeight });
transaction.add(...instructions);

// Send
const signature = await sendTransaction(transaction, connection);
```

### ConnectorKit

```typescript
const { signer } = useTransactionSigner();

// Build transaction
const transaction = new Transaction({ feePayer: publicKey, blockhash, lastValidBlockHeight });
transaction.add(...instructions);

// Send via signer
const signature = await signer.signAndSendTransaction(transaction);
```

### Wallet-UI (with gill)

```typescript
import { createTransaction, signAndSendTransactionMessageWithSigners } from 'gill';

const signer = useWalletUiSigner({ account });

// Build transaction with gill
const transaction = createTransaction({
  version: 'legacy',
  feePayer: signer,
  instructions,
  latestBlockhash,
});

// Send via gill
const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction);
```

---

## Gasless Transactions

When a user connects via LazorKit, they automatically get gasless transactions - the paymaster covers all fees. Other wallets pay standard SOL fees.

The code doesn't need to differentiate - LazorKit handles this automatically when transactions are sent through its signer.

---

## Complete Example

Each adapter page follows this structure:

1. **Provider Setup** - Configure the adapter with LazorKit registered
2. **Transfer Form** - Uses shared hooks (`useBalances`, `useTransferForm`)
3. **Validation** - Uses shared utilities (`validateRecipientAddress`, `validateTransferAmount`)
4. **Send Transaction** - Uses `withRetry` and `buildUsdcTransferInstructions`
5. **Success/Error Handling** - Uses `createTransferSuccessMessage` and `formatTransactionError`

> **Source**: See the full implementations:
> - [Anza Adapter](anza-adapter/page.tsx)
> - [ConnectorKit](connectorkit/page.tsx)
> - [Wallet-UI](wallet-ui/page.tsx)
> - [Jupiter Unified Wallet Kit](unified-wallet-kit/page.tsx)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| LazorKit not appearing | Ensure `registerLazorkitWallet()` is called before provider mounts |
| Popup blocked | Allow popups for the site in browser settings |
| Transaction fails | Check RPC connection and balance |
| "Wallet not connected" | Ensure user has selected a wallet from the modal |

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration](https://lazorkit-cookbook.vercel.app/examples/05-wallet-adapter-integration)

---

## Related Documentation

For step-by-step tutorials and patterns explanation, see the [Cookbook Documentation](../../../../docs/README.md):

- [Wallet Adapters Tutorial](../../../../docs/06-wallet-adapters.md) - Integration walkthrough for all adapters
- [LazorKit Basics](../../../../docs/02-lazorkit-basics.md) - Understanding `registerLazorkitWallet` and native features
- [Cookbook Patterns](../../../../docs/03-cookbook-patterns.md) - Reusable patterns for LazorKit integrations

## External Resources

- [Anza Wallet Adapter](https://github.com/anza-xyz/wallet-adapter)
- [ConnectorKit](https://www.connectorkit.dev)
- [Wallet-UI](https://wallet-ui.dev)
- [Jupiter Unified Wallet Kit](https://github.com/TeamRaccoons/Unified-Wallet-Kit)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [LazorKit Documentation](https://docs.lazorkit.com/)

---

## Next Steps

- Explore [Example 02: Gasless USDC Transfer](../02-gasless-transfer/README.md) for standalone LazorKit usage
- Try [Example 03: Subscription Service](../03-subscription-service/README.md) for advanced program integration
- Check out [Solana Protocol Integrations](../../../../docs/04-solana-protocols/README.md) for DeFi examples
