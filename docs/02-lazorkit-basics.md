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
  wallet,                  // Wallet info after connection
  isConnected,             // Boolean: is user connected?
  isConnecting,            // Boolean: is connection in progress?
  connect,                 // Function: opens passkey authentication
  disconnect,              // Function: clears session
  signAndSendTransaction,  // Function: sends gasless transactions
  signMessage,             // Function: signs arbitrary messages
  verifyMessage,           // Function: verifies signed messages
} = useWallet();
```

### Wallet Object

After connection, `wallet` contains:

```typescript
{
  smartWallet: string,    // User's Solana address - use this for transactions
  credentialId: string,   // Passkey identifier
  passkeyPubkey: string,  // Public key from passkey
  platform: string,       // Device type
  walletDevice: string,   // Device model
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

| Operation | Recommended Limit |
|-----------|-------------------|
| Token Transfer | 200,000 |
| NFT Mint | 400,000 |
| DEX Swap | 600,000 |
| Complex DeFi | 400,000 - 600,000 |

```typescript
signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

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
