# Recipe 08: Liquid Staking with Marinade

**Stake SOL for mSOL with gas fees sponsored by LazorKit Paymaster**

This recipe demonstrates how to integrate Marinade Finance's liquid staking protocol with LazorKit. Users can stake SOL to receive mSOL (liquid staking token) and unstake via the liquidity pool - all with gas fees covered by LazorKit's paymaster.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Integrate Marinade SDK with LazorKit smart wallets
- Process external SDK transactions for LazorKit (remove ComputeBudget, add smart wallet)
- Fetch real-time unstake quotes from Marinade state
- Display liquid staking token (mSOL) balances
- Handle token account creation (rent costs)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIQUID STAKING FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐    │
│  │   User UI   │───▶│  Marinade SDK    │───▶│  Build Stake/    │    │
│  │  (Next.js)  │    │  deposit() or    │    │  Unstake Tx      │    │
│  └─────────────┘    │  liquidUnstake() │    │                  │    │
│         │           └──────────────────┘    └──────────────────┘    │
│         │                                            │               │
│         ▼                                            ▼               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Process Transaction for LazorKit                 │   │
│  │  1. Remove ComputeBudget instructions (LazorKit handles)     │   │
│  │  2. Add smart wallet to ALL instruction account lists        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    LazorKit Paymaster                         │   │
│  │  - Signs transaction with user passkey                       │   │
│  │  - Pays all gas fees                                         │   │
│  │  - Submits to Solana network                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What is mSOL?

**mSOL** is Marinade's liquid staking token. When you stake SOL with Marinade:

| Feature | Description |
|---------|-------------|
| **Liquid** | Unlike regular staking, mSOL can be traded, used in DeFi, or unstaked anytime |
| **Appreciating** | mSOL/SOL exchange rate increases as staking rewards accrue |
| **Instant Unstake** | Swap mSOL back to SOL via liquidity pool (small fee applies) |

Current mSOL price: ~1.08-1.10 SOL (varies based on accumulated rewards)

---

## Prerequisites

- Completed [Recipe 01](../01-passkey-wallet-basics/README.md) and [Recipe 04](../04-gasless-raydium-swap/README.md)
- Understanding of liquid staking concepts
- Devnet SOL for testing (from [Solana Faucet](https://faucet.solana.com))

---

## Step 1: Install Dependencies

```bash
npm install @marinade.finance/marinade-ts-sdk bn.js @types/bn.js
```

---

## Step 2: Initialize Marinade SDK

```typescript
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import BN from 'bn.js';
import { getConnection } from '@/lib/solana-utils';

// Initialize Marinade with smart wallet
const connection = getConnection();
const config = new MarinadeConfig({
  connection,
  publicKey: new PublicKey(wallet.smartWallet),
});
const marinade = new Marinade(config);

// Fetch mSOL price (exchange rate)
const state = await marinade.getMarinadeState();
const msolPrice = state.mSolPrice;  // e.g., 1.085 SOL per mSOL
```

---

## Step 3: Process Instructions for LazorKit

When integrating external SDKs with LazorKit, two transformations are required:

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Get transaction from Marinade SDK
const { transaction } = await marinade.deposit(new BN(amount * LAMPORTS_PER_SOL));

// Process for LazorKit:
// 1. Remove ComputeBudget instructions (LazorKit handles compute)
// 2. Add smart wallet to ALL instruction account lists (LazorKit validation)
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Send via LazorKit (gas fees sponsored by paymaster)
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

### Why These Transformations?

**1. Remove ComputeBudget Instructions**
- LazorKit manages compute budget automatically via its paymaster
- External SDKs often add their own ComputeBudget instructions that conflict

```typescript
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
const filtered = instructions.filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM));
```

**2. Add Smart Wallet to All Instructions**
- LazorKit's `execute_cpi` validates the smart wallet is present in ALL instruction account lists
- Some instructions (like token transfers) don't naturally include the wallet

```typescript
instructions.forEach((ix) => {
  const hasSmartWallet = ix.keys.some(k => k.pubkey.toBase58() === wallet.smartWallet);
  if (!hasSmartWallet) {
    ix.keys.push({ pubkey: new PublicKey(wallet.smartWallet), isSigner: false, isWritable: false });
  }
});
```

---

## Step 4: Implement Staking

```typescript
const handleStake = async () => {
  if (!wallet || !stakeAmount) return;

  setStaking(true);
  try {
    const amount = parseFloat(stakeAmount);
    const amountLamports = new BN(amount * LAMPORTS_PER_SOL);

    // Build stake transaction from Marinade
    const { transaction } = await marinade.deposit(amountLamports);

    // Process for LazorKit
    const instructions = processInstructionsForLazorKit(
      transaction.instructions,
      wallet.smartWallet
    );

    // Send gasless transaction
    const signature = await signAndSendTransaction({
      instructions,
      transactionOptions: { computeUnitLimit: 400_000 }
    });

    // Refresh balances
    await fetchBalances();
    await fetchMsolBalance();

    alert(`Staked ${amount} SOL! Gas fees sponsored by LazorKit.`);
  } catch (err) {
    console.error('Stake error:', err);
  } finally {
    setStaking(false);
  }
};
```

---

## Step 5: Implement Instant Unstake

Instant unstake swaps mSOL for SOL via Marinade's liquidity pool:

```typescript
const handleInstantUnstake = async () => {
  if (!wallet || !unstakeAmount) return;

  setUnstaking(true);
  try {
    const amount = parseFloat(unstakeAmount);
    const amountLamports = new BN(amount * LAMPORTS_PER_SOL);

    // Build unstake transaction from Marinade
    const { transaction } = await marinade.liquidUnstake(amountLamports);

    // Process for LazorKit
    const instructions = processInstructionsForLazorKit(
      transaction.instructions,
      wallet.smartWallet
    );

    // Send gasless transaction
    const signature = await signAndSendTransaction({
      instructions,
      transactionOptions: { computeUnitLimit: 400_000 }
    });

    await fetchBalances();
    await fetchMsolBalance();

    alert(`Unstaked ${amount} mSOL! Gas fees sponsored by LazorKit.`);
  } catch (err) {
    console.error('Unstake error:', err);
  } finally {
    setUnstaking(false);
  }
};
```

---

## Step 6: Fetch Real-Time Unstake Quote

Get the actual fee from Marinade state before unstaking:

```typescript
const fetchUnstakeQuote = async (msolAmount: number) => {
  if (!marinade || !msolPrice || msolAmount <= 0) return;

  try {
    const state = await marinade.getMarinadeState();

    // Calculate expected SOL output
    const expectedSolLamports = Math.floor(msolAmount * msolPrice * LAMPORTS_PER_SOL);

    // Get actual fee from Marinade state (in basis points)
    const feeBp = await state.unstakeNowFeeBp(new BN(expectedSolLamports));

    // Calculate final output after fee
    const feeMultiplier = 1 - (feeBp / 10000);
    const finalSolOutput = (msolAmount * msolPrice) * feeMultiplier;

    setUnstakeQuote({
      solOutput: finalSolOutput,
      feeBp: feeBp  // e.g., 30 = 0.30%
    });
  } catch (err) {
    console.error('Quote error:', err);
  }
};
```

---

## Token Account Rent Notice

On **first stake**, Solana creates an mSOL token account which requires:

| Item | Cost |
|------|------|
| mSOL Token Account Rent | ~0.002 SOL |
| Gas Fees | Sponsored by LazorKit |

**Important**: The rent is fully reclaimable if you close the account later. LazorKit's paymaster covers gas fees, but rent must be paid from your SOL balance.

---

## Key Addresses

| Token/Program | Address |
|---------------|---------|
| mSOL Mint | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` |
| Marinade Program | `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD` |

These addresses are the same on both Devnet and Mainnet.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Insufficient liquidity" | Try a smaller unstake amount |
| "src.toArrayLike is not a function" | Ensure using `new BN()` for amounts |
| "fs module not found" | Add webpack/turbopack config (see above) |
| High unstake fee | Liquidity pool depth varies - try smaller amount |

---

## Complete Example

The full implementation uses centralized utilities for LazorKit processing.

**Utilities Used:**

| Utility | Source | Description |
|---------|--------|-------------|
| `processInstructionsForLazorKit()` | `@/lib/lazorkit-utils` | Filter ComputeBudget + add smart wallet |
| `getConnection()` | `@/lib/solana-utils` | Cached Solana connection |
| `useLazorkitWalletConnect()` | `@/hooks/useLazorkitWalletConnect` | Wallet connection with error handling |
| `useBalances()` | `@/hooks/useBalances` | SOL/USDC balance management |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `handleStake()` | Stakes SOL for mSOL via Marinade |
| `handleInstantUnstake()` | Swaps mSOL back to SOL via liquidity pool |
| `fetchUnstakeQuote()` | Gets real-time fee quote from Marinade state |
| `fetchMsolBalance()` | Fetches mSOL token balance |

> **Source**: See the full implementation at [`page.tsx`](page.tsx)

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/08-marinade-staking](https://lazorkit-cookbook.vercel.app/examples/08-marinade-staking)

---

## Resources

- [Marinade Finance Documentation](https://docs.marinade.finance/)
- [Marinade SDK GitHub](https://github.com/marinade-finance/marinade-ts-sdk)
- [LazorKit SDK Documentation](https://docs.lazorkit.com/)
- [Solana Devnet Faucet](https://faucet.solana.com)

---

## Next Steps

- Explore [Recipe 04: Gasless Raydium Swap](../04-gasless-raydium-swap/README.md) for another DeFi integration pattern
- Check out [Recipe 07: Gasless cNFT Minting](../07-compressed-nft-minting/README.md) for truly gasless operations
- Build your own gasless DeFi application with LazorKit!
