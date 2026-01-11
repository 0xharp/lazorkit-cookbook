# LazorKit Basics

This guide explains what the LazorKit SDK (`@lazorkit/wallet`) provides natively. For the patterns and utilities we built on top of LazorKit, see [Cookbook Patterns](03-cookbook-patterns.md).

## What LazorKit Provides

The `@lazorkit/wallet` SDK gives you everything needed for passkey-based Solana wallets:

### LazorkitProvider

Wrap your app to enable wallet functionality:

```typescript
import { LazorkitProvider } from '@lazorkit/wallet';

<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{
    paymasterUrl: "https://kora.devnet.lazorkit.com"
  }}
>
  {children}
</LazorkitProvider>
```

**Configuration options:**
- `rpcUrl` - Solana RPC endpoint (devnet or mainnet)
- `portalUrl` - LazorKit authentication portal
- `paymasterConfig.paymasterUrl` - Paymaster service for gasless transactions

### useWallet Hook

The primary interface for wallet interactions:

```typescript
import { useWallet } from '@lazorkit/wallet';

const {
  wallet,                  // WalletInfo | null - wallet data after connection
  smartWalletPubkey,       // PublicKey | null - user's Solana public key
  isConnected,             // boolean - is user connected?
  isConnecting,            // boolean - is connection in progress?
  isLoading,               // boolean - general loading state
  isSigning,               // boolean - is transaction signing in progress?
  error,                   // Error | null - last error if any
  connect,                 // (options?) => Promise<WalletInfo> - opens passkey auth
  disconnect,              // () => Promise<void> - clears session
  signAndSendTransaction,  // (payload) => Promise<string> - sends gasless transactions
  signMessage,             // (message: string) => Promise<{signature, signedPayload}>
  verifyMessage,           // (args) => Promise<boolean> - verifies signed messages
} = useWallet();
```

**Most commonly used:** `connect`, `disconnect`, `wallet`, `isConnected`, and `signAndSendTransaction`. These are also exposed in our custom `useLazorkitWalletConnect` hook (see [Getting Started](01-getting-started.md)).

For complete type definitions and detailed information, refer to the `index.d.ts` file in the [@lazorkit/wallet npm package](https://www.npmjs.com/package/@lazorkit/wallet?activeTab=code).

### Wallet Object

After connection, `wallet` contains:

```typescript
interface WalletInfo {
  smartWallet: string;       // User's Solana address - use this for transactions
  credentialId: string;      // Passkey identifier
  passkeyPubkey: number[];   // Public key bytes from passkey (33 bytes)
  expo: string;              // Exponent value
  platform: string;          // Device type (e.g., "web", "mobile")
  walletDevice: string;      // Device model
  accountName?: string;      // Optional account name
}
```

The `smartWallet` address is what you use for all Solana operations - building instructions, checking balances, etc.

### Gasless Transactions

The `signAndSendTransaction` function sends transactions without users paying gas fees - the LazorKit paymaster covers all fees:

```typescript
const signature = await signAndSendTransaction({
  instructions: [transferInstruction, ...otherInstructions],
  transactionOptions: {
    computeUnitLimit: 200_000,          // Override compute units
    clusterSimulation: 'devnet',        // Network for simulation
  }
});
```

**What happens when you call this:**
1. LazorKit portal opens for passkey authentication (Face ID / Touch ID)
2. User approves with biometric
3. Paymaster wraps and sponsors the transaction
4. Transaction is sent to Solana
5. Signature is returned on success

### registerLazorkitWallet

For integrating LazorKit with wallet adapters (Anza Wallet Adapter, ConnectorKit, etc.):

```typescript
import { registerLazorkitWallet } from '@lazorkit/wallet';

registerLazorkitWallet({
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com"
  },
});
```

This registers LazorKit as a wallet-standard compatible wallet, making it appear alongside Phantom, Solflare, etc. in wallet selection UIs.

## The Transaction Flow

Here's what happens when a user sends a gasless transaction:

```
User clicks action button ("Send", "Swap", "Mint")
         ↓
Your app builds instructions array
         ↓
signAndSendTransaction({ instructions })
         ↓
LazorKit Portal opens
         ↓
User authenticates with passkey (Face ID / Touch ID)
         ↓
Paymaster service sponsors the transaction
         ↓
Transaction sent to Solana
         ↓
Signature returned to your app
```

## Compute Unit Limits

Different operations require different compute limits. Pass these via `transactionOptions`:

```typescript
signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

**Recommendation**: Start with a lower compute unit value and increase only if the transaction fails due to insufficient compute. This avoids wasting compute resources and ensures efficient transaction processing.

After testing internally for our cookbook examples, here are the compute units we're using:

| Operation | Cookbook Value |
|-----------|----------------|
| Token Transfer | 200,000 |
| NFT Mint | 400,000 |
| DEX Swap | 600,000 |
| Complex DeFi | 400,000 - 600,000 |

These values work for our examples, but your specific use case may require different limits depending on the complexity of your instructions.

## What This Cookbook Adds

While LazorKit handles the core wallet and transaction functionality, this cookbook provides additional patterns for:

- **Wallet connection wrapper** - Error handling for popup blockers, loading states
- **External SDK integration** - Preparing instructions from Raydium, Marinade, etc.
- **Metaplex integration** - Pattern for using Umi with LazorKit
- **Balance management** - Fetching and refreshing token balances
- **Error handling** - User-friendly error messages and retry logic

These patterns are documented in [Cookbook Patterns](03-cookbook-patterns.md) and implemented in the `/app/hooks/` and `/app/lib/` directories.

## Next Steps

- [Cookbook Patterns](03-cookbook-patterns.md) - Learn the patterns we built for this cookbook
- [Getting Started](01-getting-started.md) - Set up your environment
- [Solana Protocols](04-solana-protocols/README.md) - Integrate with Raydium, Metaplex, Marinade
- [Custom Programs](05-custom-programs/README.md) - Build your own Anchor programs
- [Utilities Reference](07-utilities-reference.md) - Full API documentation
