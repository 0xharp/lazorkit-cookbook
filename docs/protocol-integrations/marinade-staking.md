# Marinade Staking Integration

This guide covers integrating Marinade Finance's liquid staking with LazorKit.

## Overview

Marinade is Solana's largest liquid staking protocol. Users stake SOL to receive mSOL, which can be traded, used in DeFi, or unstaked anytime.

**Example**: [08-marinade-staking](../../examples/08-marinade-staking/README.md)

## Key Concepts

| Feature | Description |
|---------|-------------|
| **mSOL** | Liquid staking token that appreciates vs SOL |
| **Instant Unstake** | Swap mSOL for SOL via liquidity pool (0.1-3% fee) |
| **Delayed Unstake** | Order ticket, claim after epoch (~2 days, 0.1% fee) |

## Integration Steps

### 1. Initialize Marinade SDK

```typescript
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import BN from 'bn.js';

const config = new MarinadeConfig({
  connection: getConnection(),
  publicKey: new PublicKey(wallet.smartWallet),
});

const marinade = new Marinade(config);
```

### 2. Get mSOL Price

```typescript
const state = await marinade.getMarinadeState();
const msolPrice = state.mSolPrice;  // e.g., 1.085 SOL per mSOL
```

### 3. Stake SOL

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Build stake transaction
const { transaction } = await marinade.deposit(
  new BN(amount * LAMPORTS_PER_SOL)
);

// Process for LazorKit
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Send gasless
await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

### 4. Instant Unstake

```typescript
// Build unstake transaction
const { transaction } = await marinade.liquidUnstake(
  new BN(msolAmount * LAMPORTS_PER_SOL)
);

// Process and send
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

await signAndSendTransaction({ instructions });
```

### 5. Get Unstake Quote

```typescript
const state = await marinade.getMarinadeState();
const expectedSolLamports = Math.floor(msolAmount * msolPrice * LAMPORTS_PER_SOL);
const feeBp = await state.unstakeNowFeeBp(new BN(expectedSolLamports));

// Calculate output after fee
const feeMultiplier = 1 - (feeBp / 10000);
const finalSolOutput = (msolAmount * msolPrice) * feeMultiplier;
```

## Key Addresses

| Token/Program | Address |
|---------------|---------|
| mSOL Mint | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` |
| Marinade Program | `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD` |

> Same addresses on Devnet and Mainnet.

## Rent Considerations

On first stake, Solana creates an mSOL token account:

| Cost | Amount | Notes |
|------|--------|-------|
| mSOL ATA Rent | ~0.002 SOL | One-time, reclaimable |
| Gas Fees | $0 | Covered by paymaster |

## Webpack Configuration

Marinade SDK uses Node.js modules. Add to `next.config.js`:

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
  }
  return config;
},
```

## SDK Methods Reference

| Method | Description |
|--------|-------------|
| `marinade.deposit(lamports)` | Stake SOL, receive mSOL |
| `marinade.liquidUnstake(lamports)` | Instant swap mSOL to SOL |
| `marinade.orderUnstake(lamports)` | Create delayed unstake ticket |
| `marinade.claim(ticketPubkey)` | Claim matured ticket |
| `marinade.getDelayedUnstakeTickets(owner)` | Fetch pending tickets |
| `marinade.getMarinadeState()` | Get mSOL price and pool info |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient liquidity" | Try smaller unstake amount |
| "src.toArrayLike is not a function" | Use `new BN()` for amounts |
| "fs module not found" | Add webpack fallback config |
| High unstake fee | Liquidity pool depth varies |

## Resources

- [Marinade Finance Docs](https://docs.marinade.finance/)
- [Marinade SDK GitHub](https://github.com/marinade-finance/marinade-ts-sdk)
- [Example 08 Source](../../examples/08-marinade-staking/page.tsx)
