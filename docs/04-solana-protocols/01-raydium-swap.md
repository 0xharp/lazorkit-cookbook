# Raydium Swap Integration

This tutorial shows how to build gasless DEX swaps using Raydium and LazorKit.

## What You'll Build

A swap interface where users can trade tokens on Raydium without paying any gas fees.

## Prerequisites

- LazorKit provider configured ([Getting Started](../01-getting-started.md))
- Basic understanding of DEX mechanics

## Step 1: Get a Swap Quote

Use Raydium's Trade API to get real-time pricing. We request `txVersion=LEGACY` to get transaction instructions in a format that's straightforward to extract and process:

```typescript
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';

const getQuote = async (inputMint: string, outputMint: string, amount: number) => {
  const response = await fetch(
    `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
    `inputMint=${inputMint}&` +
    `outputMint=${outputMint}&` +
    `amount=${amount}&` +
    `slippageBps=50&` +
    `txVersion=LEGACY`
  );

  return response.json();
};
```

## Step 2: Build the Swap Transaction

Request the transaction from Raydium:

```typescript
import axios from 'axios';

const buildSwapTransaction = async (quoteData: any, walletAddress: string) => {
  const { data } = await axios.post(
    `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
    {
      swapResponse: quoteData,
      txVersion: 'LEGACY',
      wallet: walletAddress,
      wrapSol: true,   // Wrap SOL if needed
      unwrapSol: true, // Unwrap SOL if needed
    }
  );

  return data;
};
```

## Step 3: Process and Send

Raydium's SDK adds ComputeBudget instructions and doesn't include the LazorKit smart wallet in all accounts. We use `processInstructionsForLazorKit` to handle this (see [Cookbook Patterns](../03-cookbook-patterns.md#pattern-2-external-sdk-integration) for details):

```typescript
import { Transaction } from '@solana/web3.js';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const executeSwap = async () => {
  // Get quote
  const quoteData = await getQuote(inputMint, outputMint, amount);

  // Build transaction
  const swapData = await buildSwapTransaction(quoteData.data, wallet.smartWallet);

  // Deserialize transaction
  const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
  const legacyTx = Transaction.from(txBuffer);

  // Process for LazorKit
  const instructions = processInstructionsForLazorKit(
    legacyTx.instructions,
    wallet.smartWallet
  );

  // Send gasless transaction
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 600_000 }
  });

  return signature;
};
```

## Complete Example

```typescript
'use client';

import { useState } from 'react';
import { Transaction } from '@solana/web3.js';
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';
import axios from 'axios';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const TOKENS = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDC: { mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', decimals: 6 },
};

export default function SwapPage() {
  const { wallet, isConnected, signAndSendTransaction } = useLazorkitWalletConnect();
  const { fetchBalances } = useBalances(wallet?.smartWallet);
  const [swapping, setSwapping] = useState(false);

  const handleSwap = async (inputAmount: number) => {
    if (!wallet) return;

    setSwapping(true);
    try {
      // 1. Get quote
      const quoteRes = await fetch(
        `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
        `inputMint=${TOKENS.SOL.mint}&outputMint=${TOKENS.USDC.mint}&` +
        `amount=${inputAmount * 10 ** TOKENS.SOL.decimals}&slippageBps=50&txVersion=LEGACY`
      );
      const quoteData = await quoteRes.json();

      // 2. Build transaction
      const { data: swapData } = await axios.post(
        `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
        { swapResponse: quoteData.data, txVersion: 'LEGACY', wallet: wallet.smartWallet }
      );

      // 3. Process for LazorKit
      const legacyTx = Transaction.from(Buffer.from(swapData.data[0].transaction, 'base64'));
      const instructions = processInstructionsForLazorKit(legacyTx.instructions, wallet.smartWallet);

      // 4. Send gasless
      await signAndSendTransaction({
        instructions,
        transactionOptions: { computeUnitLimit: 600_000 }
      });

      await fetchBalances();
      alert('Swap successful! No gas fees paid.');
    } catch (err) {
      console.error('Swap error:', err);
    } finally {
      setSwapping(false);
    }
  };

  return (
    <button onClick={() => handleSwap(0.1)} disabled={swapping || !isConnected}>
      {swapping ? 'Swapping...' : 'Swap 0.1 SOL → USDC (Gasless)'}
    </button>
  );
}
```

## Token Configuration

```typescript
// Devnet tokens
const TOKENS = {
  SOL: {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  USDC: {
    symbol: 'USDC',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
  },
};
```

## Resources

- [Raydium Trade API Docs](https://docs.raydium.io/raydium/traders/trade-api)
- [Example 04 Full Source](../../app/app/examples/04-gasless-raydium-swap/page.tsx)
- [Live Demo](https://lazorkit-cookbook.vercel.app/examples/04-gasless-raydium-swap)
