# Marinade Staking Integration

This tutorial shows how to integrate Marinade Finance liquid staking with LazorKit for gasless staking operations.

## What You'll Build

A staking interface where users can:
- Stake SOL to receive mSOL (liquid staking token)
- Instantly unstake mSOL back to SOL
- All with gas fees covered by LazorKit

## What is mSOL?

mSOL is Marinade's liquid staking token:

| Feature | Description |
|---------|-------------|
| **Liquid** | Trade, use in DeFi, or unstake anytime |
| **Appreciating** | Value increases as staking rewards accrue |
| **Instant Unstake** | Swap back to SOL via liquidity pool |

## Step 1: Install Dependencies

```bash
npm install @marinade.finance/marinade-ts-sdk bn.js
```

## Step 2: Initialize Marinade SDK

```typescript
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-utils';

const initMarinade = (walletAddress: string) => {
  const config = new MarinadeConfig({
    connection: getConnection(),
    publicKey: new PublicKey(walletAddress),
  });

  return new Marinade(config);
};
```

## Step 3: Stake SOL

```typescript
import BN from 'bn.js';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const handleStake = async (solAmount: number) => {
  const marinade = initMarinade(wallet.smartWallet);
  const amountLamports = new BN(solAmount * 1e9);

  // Build stake transaction
  const { transaction } = await marinade.deposit(amountLamports);

  // Process for LazorKit
  const instructions = processInstructionsForLazorKit(
    transaction.instructions,
    wallet.smartWallet
  );

  // Send gasless
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 400_000 }
  });

  return signature;
};
```

## Step 4: Instant Unstake

```typescript
const handleUnstake = async (msolAmount: number) => {
  const marinade = initMarinade(wallet.smartWallet);
  const amountLamports = new BN(msolAmount * 1e9);

  // Build unstake transaction
  const { transaction } = await marinade.liquidUnstake(amountLamports);

  // Process for LazorKit
  const instructions = processInstructionsForLazorKit(
    transaction.instructions,
    wallet.smartWallet
  );

  // Send gasless
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 400_000 }
  });

  return signature;
};
```

## Step 5: Get mSOL Price

```typescript
const getMsolPrice = async () => {
  const marinade = initMarinade(wallet.smartWallet);
  const state = await marinade.getMarinadeState();
  return state.mSolPrice; // e.g., 1.085 (SOL per mSOL)
};
```

## Step 6: Get Unstake Fee Quote

```typescript
const getUnstakeFee = async (msolAmount: number, msolPrice: number) => {
  const marinade = initMarinade(wallet.smartWallet);
  const state = await marinade.getMarinadeState();

  const expectedSolLamports = Math.floor(msolAmount * msolPrice * 1e9);
  const feeBp = await state.unstakeNowFeeBp(new BN(expectedSolLamports));

  return feeBp; // Basis points (e.g., 30 = 0.30%)
};
```

## Complete Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { getConnection } from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

export default function StakingPage() {
  const { wallet, isConnected, signAndSendTransaction } = useLazorkitWalletConnect();
  const { solBalance, fetchBalances } = useBalances(wallet?.smartWallet);
  const [msolPrice, setMsolPrice] = useState<number>(0);
  const [staking, setStaking] = useState(false);

  useEffect(() => {
    if (wallet) {
      const marinade = new Marinade(new MarinadeConfig({
        connection: getConnection(),
        publicKey: new PublicKey(wallet.smartWallet),
      }));
      marinade.getMarinadeState().then(state => setMsolPrice(state.mSolPrice));
    }
  }, [wallet]);

  const handleStake = async (amount: number) => {
    if (!wallet) return;

    setStaking(true);
    try {
      const marinade = new Marinade(new MarinadeConfig({
        connection: getConnection(),
        publicKey: new PublicKey(wallet.smartWallet),
      }));

      const { transaction } = await marinade.deposit(new BN(amount * 1e9));
      const instructions = processInstructionsForLazorKit(
        transaction.instructions,
        wallet.smartWallet
      );

      await signAndSendTransaction({
        instructions,
        transactionOptions: { computeUnitLimit: 400_000 }
      });

      await fetchBalances();
      alert('Staked successfully! Gas fees covered by LazorKit.');
    } catch (err) {
      console.error('Stake error:', err);
    } finally {
      setStaking(false);
    }
  };

  return (
    <div>
      <p>SOL Balance: {solBalance}</p>
      <p>mSOL Price: {msolPrice.toFixed(4)} SOL</p>
      <button onClick={() => handleStake(0.1)} disabled={staking || !isConnected}>
        {staking ? 'Staking...' : 'Stake 0.1 SOL (Gasless)'}
      </button>
    </div>
  );
}
```

## Key Addresses

| Token/Program | Address |
|---------------|---------|
| mSOL Mint | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` |
| Marinade Program | `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD` |

These addresses work on both Devnet and Mainnet.

## Next.js Configuration

Add webpack fallbacks for Node.js modules:

```typescript
// next.config.ts
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
  }
  return config;
},
```

## SDK Methods Reference

| Method | Description |
|--------|-------------|
| `marinade.deposit(lamports)` | Stake SOL, receive mSOL |
| `marinade.liquidUnstake(lamports)` | Instant swap mSOL → SOL |
| `marinade.getMarinadeState()` | Get mSOL price and pool info |

## Resources

- [Marinade Finance Docs](https://docs.marinade.finance/)
- [Marinade SDK GitHub](https://github.com/marinade-finance/marinade-ts-sdk)
- [Example 08 Full Source](../../app/app/examples/08-marinade-staking/page.tsx)
- [Live Demo](https://lazorkit-cookbook.vercel.app/examples/08-marinade-staking)
