# Solana Protocol Integrations

This guide shows how to integrate LazorKit with existing Solana protocols to create gasless experiences.

## The Integration Pattern

Integrating any Solana protocol with LazorKit follows a simple pattern:

```typescript
// 1. Get transaction/instructions from the protocol SDK
const { transaction } = await protocolSdk.buildTransaction(...);

// 2. Process instructions for LazorKit
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// 3. Send gasless transaction
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

### Why We Need processInstructionsForLazorKit

External SDKs don't know about LazorKit's requirements. The `processInstructionsForLazorKit` utility (which we created for this cookbook) handles two things:

1. **Removes ComputeBudget instructions** - External SDKs add their own compute budget settings, but LazorKit's paymaster handles this automatically
2. **Adds smart wallet to instruction accounts** - LazorKit's transaction validation requires the smart wallet address to be present in all instruction account lists

For the full explanation of this pattern, see [Cookbook Patterns - External SDK Integration](../03-cookbook-patterns.md#pattern-2-external-sdk-integration).

## Supported Protocols

| Protocol | Type | Tutorial |
|----------|------|----------|
| [Raydium](01-raydium-swap.md) | DEX | Gasless token swaps |
| [Metaplex](02-metaplex-nft.md) | NFTs | Regular & compressed NFT minting |
| [Marinade](03-marinade-staking.md) | DeFi | Liquid staking |

For custom Anchor programs, see [Custom Program Integration](../05-custom-programs/README.md).

## How It Works

### Step 1: Initialize the Protocol SDK

Each protocol has its own SDK. Initialize it with your connection and wallet:

```typescript
// Marinade example
const config = new MarinadeConfig({
  connection: getConnection(),
  publicKey: new PublicKey(wallet.smartWallet),
});
const marinade = new Marinade(config);
```

### Step 2: Build the Transaction

Use the SDK to build your transaction:

```typescript
// Marinade stake example
const { transaction } = await marinade.deposit(amountLamports);

// Raydium swap example
const { data } = await axios.post(RAYDIUM_API, swapParams);
const legacyTx = Transaction.from(Buffer.from(data.transaction, 'base64'));
```

### Step 3: Process for LazorKit

Use our utility to prepare instructions:

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);
```

### Step 4: Send Gasless

Send via LazorKit - the paymaster covers all fees:

```typescript
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

## Protocol-Specific Guides

### DEX Integration (Raydium)

Raydium provides a Trade API for building swap transactions:

```typescript
// Get quote
const quote = await fetch(`${RAYDIUM_API}/compute/swap-base-in?...`);

// Build transaction
const { data } = await axios.post(`${RAYDIUM_API}/transaction/swap-base-in`, {
  swapResponse: quote.data,
  wallet: wallet.smartWallet,
});

// Process and send
const legacyTx = Transaction.from(Buffer.from(data.transaction, 'base64'));
const instructions = processInstructionsForLazorKit(legacyTx.instructions, wallet.smartWallet);
await signAndSendTransaction({ instructions, transactionOptions: { computeUnitLimit: 600_000 } });
```

[Full Raydium tutorial →](01-raydium-swap.md)

### NFT Integration (Metaplex)

For Metaplex, we use a dummy signer pattern since Umi expects a signer but LazorKit handles actual signing:

```typescript
import { createDummySigner } from '@/lib/nft-utils';

// Create dummy signer for Umi
const dummySigner = createDummySigner(wallet.smartWallet);
umi.use(signerIdentity(dummySigner));

// Build Metaplex instructions
const umiInstructions = mintBuilder.getInstructions();
const web3Instructions = umiInstructions.map(toWeb3JsInstruction);

// Process and send
const instructions = processInstructionsForLazorKit(web3Instructions, wallet.smartWallet);
await signAndSendTransaction({ instructions });
```

[Full Metaplex tutorial →](02-metaplex-nft.md)

### DeFi Integration (Marinade)

Marinade SDK returns ready-to-use transactions:

```typescript
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';

const marinade = new Marinade(config);
const { transaction } = await marinade.deposit(amountLamports);

const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

await signAndSendTransaction({ instructions });
```

[Full Marinade tutorial →](03-marinade-staking.md)

## Compute Unit Guidelines

| Protocol | Operation | Recommended CU |
|----------|-----------|----------------|
| Raydium | Swap | 600,000 |
| Metaplex | NFT Mint | 400,000 |
| Metaplex | cNFT Mint | 400,000 |
| Marinade | Stake/Unstake | 400,000 |
| SPL Token | Transfer | 200,000 |

## Best Practices

1. **Always use processInstructionsForLazorKit** - This ensures compatibility with LazorKit's transaction validation

2. **Set appropriate compute limits** - Different operations need different limits; check the table above

3. **Handle errors gracefully** - Use try/catch and provide user-friendly error messages

4. **Refresh balances after transactions** - Call `fetchBalances()` to update the UI

## Next Steps

- [Raydium Swap Tutorial](01-raydium-swap.md)
- [Metaplex NFT Tutorial](02-metaplex-nft.md)
- [Marinade Staking Tutorial](03-marinade-staking.md)
- [Custom Program Integration](../05-custom-programs/README.md)
