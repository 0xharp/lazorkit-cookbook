# LazorKit Basics

This guide covers the core concepts and patterns for integrating LazorKit into your Solana dApp.

## What is LazorKit?

LazorKit provides passkey-based wallet authentication for Solana. Instead of seed phrases or browser extensions, users authenticate with Face ID, Touch ID, or security keys.

### Key Features

| Feature | Description |
|---------|-------------|
| **Passkey Authentication** | WebAuthn-based login (Face ID/Touch ID) |
| **Smart Wallets** | Solana addresses controlled by passkeys |
| **Gasless Transactions** | Paymaster covers transaction fees |
| **No Extensions** | Works directly in browsers and mobile apps |

## Core Components

### 1. LazorKit Provider

Wrap your app with the provider to enable wallet functionality:

```typescript
import { LazorkitProvider } from '@lazorkit/wallet';

<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{
    paymasterUrl: 'https://kora.devnet.lazorkit.com'
  }}
>
  {children}
</LazorkitProvider>
```

### 2. Wallet Connection

Use the `useLazorkitWalletConnect` hook for wallet operations:

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

const {
  wallet,              // Wallet object with smartWallet address
  isConnected,         // Boolean connection status
  connect,             // Connect function (opens passkey prompt)
  disconnect,          // Disconnect function
  connecting,          // Loading state
  signAndSendTransaction  // Send gasless transactions
} = useLazorkitWalletConnect();
```

### 3. Smart Wallet Address

After connection, access the wallet address:

```typescript
const walletAddress = wallet.smartWallet;  // e.g., "4zMMC9srt5..."
```

### 4. Gasless Transactions

Send transactions without SOL for gas fees:

```typescript
const signature = await signAndSendTransaction({
  instructions: [transferInstruction],
  transactionOptions: { computeUnitLimit: 200_000 }
});
```

## Integration Pattern

The standard pattern for LazorKit integrations:

```typescript
// 1. Get connection and wallet
const { wallet, signAndSendTransaction } = useLazorkitWalletConnect();

// 2. Build instructions
const instructions = await buildInstructions(...);

// 3. Send gasless transaction
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});

// 4. Confirm transaction
const connection = getConnection();
await connection.confirmTransaction(signature, 'confirmed');
```

## External Protocol Integration

When integrating external SDKs (Raydium, Marinade, Metaplex), use the `lazorkit-utils` helpers:

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Get transaction from external SDK
const { transaction } = await externalSdk.buildTransaction(...);

// Process for LazorKit:
// 1. Remove ComputeBudget instructions (LazorKit handles compute)
// 2. Add smart wallet to all instruction account lists (validation requirement)
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Send via LazorKit
await signAndSendTransaction({ instructions });
```

See [Protocol Integrations](protocol-integrations/README.md) for detailed examples.

## Important Concepts

### Smart Wallet (PDA)

LazorKit smart wallets are Program Derived Addresses (PDAs). This has implications:

- Can't use `SystemProgram.createAccount` (use `createAccountWithSeed` instead)
- Must be included in all instruction account lists for LazorKit validation

### Token Accounts

Users need token accounts (ATAs) for each SPL token. The cookbook utilities handle automatic ATA creation:

```typescript
import { buildUsdcTransferInstructions } from '@/lib/solana-utils';

// Automatically creates recipient ATA if needed
const instructions = await buildUsdcTransferInstructions(
  connection,
  senderPubkey,
  recipientPubkey,
  amount
);
```

### Rent vs Gas

LazorKit's paymaster covers **gas fees** but not **rent** (account creation costs):

| Cost Type | Who Pays | Example |
|-----------|----------|---------|
| Gas fees | Paymaster | Transaction fees |
| Rent | User's SOL | Creating NFT mint (~0.02 SOL) |

For truly gasless operations, use compressed NFTs (Example 07) which don't create accounts.

## Next Steps

- [Utilities Reference](utilities-reference.md) - Detailed API documentation
- [Wallet Adapters](wallet-adapters.md) - Multi-wallet support
- [Protocol Integrations](protocol-integrations/README.md) - External SDK integration
