# Protocol Integrations Overview

This guide explains the general pattern for integrating external Solana protocols with LazorKit.

## The Challenge

External SDKs (Raydium, Marinade, Metaplex, etc.) build transactions assuming a standard wallet. LazorKit smart wallets have specific requirements that need to be addressed.

## Two Key Transformations

When integrating any external SDK with LazorKit, two transformations are required:

### 1. Remove ComputeBudget Instructions

LazorKit manages compute budget automatically via its paymaster. External SDKs often add their own ComputeBudget instructions that conflict.

```typescript
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
const filtered = instructions.filter(
  ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM)
);
```

### 2. Add Smart Wallet to All Instructions

LazorKit's `execute_cpi` validates the smart wallet is present in ALL instruction account lists. Some instructions don't naturally include it.

```typescript
instructions.forEach((ix) => {
  const hasSmartWallet = ix.keys.some(
    k => k.pubkey.toBase58() === wallet.smartWallet
  );
  if (!hasSmartWallet) {
    ix.keys.push({
      pubkey: new PublicKey(wallet.smartWallet),
      isSigner: false,
      isWritable: false
    });
  }
});
```

## Utility Function

The cookbook provides a combined utility:

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Get transaction from external SDK
const { transaction } = await externalSdk.buildTransaction(...);

// Process for LazorKit
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Send via LazorKit (gasless)
await signAndSendTransaction({ instructions });
```

## Protocol Guides

| Protocol | Integration Guide | Example |
|----------|-------------------|---------|
| Raydium | [raydium-swap.md](raydium-swap.md) | Example 04 |
| Metaplex | [metaplex-nft.md](metaplex-nft.md) | Examples 06, 07 |
| Marinade | [marinade-staking.md](marinade-staking.md) | Example 08 |

## Transaction Format

Many protocols support versioned transactions (V0) which may not work with LazorKit. Request legacy format when available:

```typescript
// Raydium example
const { data } = await axios.get(
  `${API_URL}/swap?...&txVersion=LEGACY`
);
```

## Common Patterns

### Pattern 1: SDK Returns Transaction Object

```typescript
// SDK builds complete transaction
const { transaction } = await sdk.buildTransaction(...);

// Extract and process instructions
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Send via LazorKit
await signAndSendTransaction({ instructions });
```

### Pattern 2: SDK Returns Serialized Transaction

```typescript
// SDK returns base64 transaction
const txBase64 = await api.getTransaction(...);

// Deserialize as legacy transaction
const txBuffer = Buffer.from(txBase64, 'base64');
const legacyTx = Transaction.from(txBuffer);

// Process instructions
const instructions = processInstructionsForLazorKit(
  legacyTx.instructions,
  wallet.smartWallet
);

// Send via LazorKit
await signAndSendTransaction({ instructions });
```

### Pattern 3: Umi Instructions (Metaplex)

```typescript
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

// Build with Umi
const umiInstructions = builder.getInstructions();

// Convert to Web3.js format
const web3Instructions = umiInstructions.map(toWeb3JsInstruction);

// Process for LazorKit
const instructions = processInstructionsForLazorKit(
  web3Instructions,
  wallet.smartWallet
);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid signer" | Smart wallet not in instruction accounts |
| "Transaction too large" | Try simpler routes or split transactions |
| "Compute budget exceeded" | Increase computeUnitLimit in transaction options |
| "Versioned transaction not supported" | Request legacy transaction format |
