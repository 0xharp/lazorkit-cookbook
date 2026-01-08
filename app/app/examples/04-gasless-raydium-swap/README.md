# Recipe 04: Gasless Raydium Swap

**Swap tokens on Raydium DEX without paying gas fees - LazorKit handles everything**

This advanced recipe demonstrates how to integrate an existing DeFi protocol (Raydium) with LazorKit's gasless transaction infrastructure. Users can swap tokens without needing SOL for gas fees, providing a seamless trading experience.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Integrate Raydium Trade API for swap quotes and transactions
- Handle legacy transactions from external protocols
- Work around LazorKit validation requirements
- Manage token accounts and balances for DEX trading
- Build a gasless swap interface

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GASLESS SWAP FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │   User UI   │───▶│ Raydium API  │───▶│  Get Quote + Build Tx   │ │
│  │  (Next.js)  │    │  (Trade API) │    │  (Legacy Transaction)   │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────┘ │
│         │                                           │                │
│         │                                           ▼                │
│         │           ┌──────────────────────────────────────────┐    │
│         └──────────▶│        Process Transaction               │    │
│                     │  1. Deserialize legacy tx                │    │
│                     │  2. Remove ComputeBudget instructions    │    │
│                     │  3. Add smart wallet to all instructions │    │
│                     └──────────────────────────────────────────┘    │
│                                           │                          │
│                                           ▼                          │
│                     ┌──────────────────────────────────────────┐    │
│                     │           LazorKit Paymaster              │    │
│                     │  - Signs transaction with user passkey   │    │
│                     │  - Pays all gas fees                     │    │
│                     │  - Submits to Solana network             │    │
│                     └──────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Completed [Recipe 01](../01-passkey-wallet-basics/README.md) and [Recipe 02](../02-gasless-transfer/README.md)
- Understanding of DEX mechanics and token swaps
- Devnet SOL and USDC for testing

---

## Step 1: Import Required Dependencies

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from "axios";
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';
import { useBalances } from '@/hooks/useBalances';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { getAssociatedTokenAddressSync, getConnection } from '@/lib/solana-utils';
```

---

## Step 2: Set Up Hooks and State

Use the centralized hooks for wallet connection and balance management:

```typescript
export default function Recipe04() {
  const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
  const [inputToken, setInputToken] = useState<'SOL' | 'USDC'>('SOL');
  const [outputToken, setOutputToken] = useState<'SOL' | 'USDC'>('USDC');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [swapping, setSwapping] = useState(false);

  const {
    solBalance,
    usdcBalance,
    fetchBalances,
  } = useBalances(isConnected ? wallet?.smartWallet : null);

  const balances = {
    SOL: solBalance ?? 0,
    USDC: usdcBalance ?? 0,
  };
}
```

---

## Step 3: Get Swap Quote from Raydium

Use Raydium's Trade API to get real-time price quotes:

```typescript
const calculateOutputAmount = async () => {
  if (!wallet || !inputAmount || parseFloat(inputAmount) <= 0) {
    setOutputAmount('');
    return;
  }

  try {
    const inputMint = TOKENS[inputToken].mint;
    const outputMint = TOKENS[outputToken].mint;
    const amount = parseFloat(inputAmount) * Math.pow(10, TOKENS[inputToken].decimals);

    const quoteResponse = await fetch(
      `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${Math.floor(amount)}&` +
      `slippageBps=50&` +
      `txVersion=LEGACY`
    );

    const quoteData = await quoteResponse.json();
    const outputAmountRaw = parseFloat(quoteData.data.outputAmount);
    const formattedOutput = (outputAmountRaw / Math.pow(10, TOKENS[outputToken].decimals)).toFixed(6);

    setOutputAmount(formattedOutput);
  } catch (err) {
    console.error('Quote error:', err);
  }
};
```

---

## Step 4: Build and Execute the Swap

The key challenge is adapting Raydium's transaction for LazorKit:

```typescript
const handleSwap = async () => {
  if (!wallet || !inputAmount) return;

  setSwapping(true);
  try {
    // 1. Get quote from Raydium
    const { data: swapResponse } = await axios.get(
      `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?...&txVersion=LEGACY`
    );

    // 2. Build transaction from Raydium
    const { data: swapData } = await axios.post(
      `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
      {
        swapResponse,
        txVersion: 'LEGACY',  // Important: Request legacy format
        wallet: wallet.smartWallet,
        wrapSol: inputMint === TOKENS.SOL.mint,
        unwrapSol: outputMint === TOKENS.SOL.mint,
      }
    );

    // 3. Deserialize as Legacy Transaction
    const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
    const legacyTx = Transaction.from(txBuffer);

    // 4. Remove ComputeBudget instructions (LazorKit handles this)
    const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
    const instructions = legacyTx.instructions.filter(
      ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM)
    );

    // 5. Add smart wallet to instructions that need it (LazorKit requirement)
    instructions.forEach((ix) => {
      const hasSmartWallet = ix.keys.some(k => k.pubkey.toBase58() === wallet.smartWallet);
      if (!hasSmartWallet) {
        ix.keys.push({ pubkey: new PublicKey(wallet.smartWallet), isSigner: false, isWritable: false });
      }
    });

    // 6. Send gasless transaction via LazorKit
    const signature = await signAndSendTransaction({
      instructions,
      transactionOptions: { computeUnitLimit: 600_000 }
    });

    await fetchBalances();
    alert(`Swap successful! No gas fees paid.`);
  } catch (err) {
    console.error('Swap error:', err);
  } finally {
    setSwapping(false);
  }
};
```

---

## Integration Challenges & Solutions

When integrating external protocols like Raydium with LazorKit, you may encounter these issues:

### 1. Transaction Format
**Problem**: Versioned transactions (V0) may not work with LazorKit.
**Solution**: Request legacy transactions from the protocol API.

```typescript
txVersion: 'LEGACY'
```

### 2. ComputeBudget Instructions
**Problem**: LazorKit manages compute budget automatically.
**Solution**: Filter out ComputeBudget instructions from the transaction.

```typescript
const instructions = legacyTx.instructions.filter(
  ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM)
);
```

### 3. Smart Wallet Validation
**Problem**: LazorKit's `execute_cpi` expects the smart wallet in ALL instruction key lists.
**Solution**: Add the smart wallet to any instruction that doesn't include it.

```typescript
if (!hasSmartWallet) {
  ix.keys.push({ pubkey: smartWallet, isSigner: false, isWritable: false });
}
```

---

## Token Configuration

Define supported tokens with their mint addresses and decimals:

```typescript
const TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',  // Devnet
    decimals: 6,
  },
};
```

---

## Complete Example

The complete implementation uses centralized hooks and handles the full swap flow.

**Custom Hooks Used:**

| Hook | Description |
|------|-------------|
| `useLazorkitWalletConnect()` | Wallet connection with popup error handling |
| `useBalances()` | Automatic SOL/USDC balance management |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `calculateOutputAmount()` | Gets real-time quote from Raydium API |
| `handleSwap()` | Builds, processes, and executes the gasless swap |
| `handleFlipTokens()` | Swaps input/output token selection |

> **Source**: See the full implementation at [`page.tsx`](page.tsx)

---

## Devnet Limitations

This recipe currently supports the **SOL/USDC** pair on Devnet. The focus is on demonstrating the integration pattern rather than comprehensive token support.

**For Mainnet deployment:**
- Add comprehensive token lists via token-list APIs
- Support more trading pairs
- Implement proper slippage controls
- Add price impact warnings

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No liquidity" | Devnet pools may have limited liquidity - try smaller amounts |
| "Transaction too large" | Complex routes may exceed limits - try a direct pair |
| "Slippage exceeded" | Increase slippage tolerance or try again |
| "Insufficient balance" | Ensure you have enough of the input token |

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/04-gasless-raydium-swap](https://lazorkit-cookbook.vercel.app/examples/04-gasless-raydium-swap)

---

## Resources

- [Raydium Trade API Documentation](https://docs.raydium.io/raydium/traders/trade-api)
- [LazorKit SDK Documentation](https://docs.lazorkit.com/)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Circle USDC Faucet (Devnet)](https://faucet.circle.com)

---

## Next Steps

- Explore [Recipe 03: Subscription Service](../03-subscription-service/README.md) for recurring payment patterns
- Check out the [Anchor Program Documentation](../../../../program/subscription-program/README.md)
- Build your own gasless DeFi application!
