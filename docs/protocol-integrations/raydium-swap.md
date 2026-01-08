# Raydium Swap Integration

This guide covers integrating Raydium DEX with LazorKit for gasless token swaps.

## Overview

Raydium is Solana's leading DEX. This integration uses Raydium's Trade API to get swap quotes and build transactions, then processes them for LazorKit.

**Example**: [04-gasless-raydium-swap](../../examples/04-gasless-raydium-swap/README.md)

## Integration Steps

### 1. Get Swap Quote

```typescript
import axios from 'axios';
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';

const quoteResponse = await fetch(
  `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
  `inputMint=${inputMint}&` +
  `outputMint=${outputMint}&` +
  `amount=${amountRaw}&` +
  `slippageBps=50&` +
  `txVersion=LEGACY`  // Important: Request legacy format
);

const quoteData = await quoteResponse.json();
const outputAmount = quoteData.data.outputAmount;
```

### 2. Build Transaction

```typescript
const { data: swapData } = await axios.post(
  `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
  {
    swapResponse: quoteData.data,
    txVersion: 'LEGACY',
    wallet: wallet.smartWallet,
    wrapSol: inputMint === SOL_MINT,
    unwrapSol: outputMint === SOL_MINT,
  }
);

// Deserialize legacy transaction
const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
const legacyTx = Transaction.from(txBuffer);
```

### 3. Process for LazorKit

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const instructions = processInstructionsForLazorKit(
  legacyTx.instructions,
  wallet.smartWallet
);
```

### 4. Send Gasless Transaction

```typescript
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 600_000 }
});
```

## Token Configuration

```typescript
const TOKENS = {
  SOL: {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  USDC: {
    symbol: 'USDC',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',  // Devnet
    decimals: 6,
  },
};
```

## Key Points

| Point | Details |
|-------|---------|
| Transaction format | Must use `txVersion: 'LEGACY'` |
| SOL wrapping | Use `wrapSol`/`unwrapSol` for native SOL swaps |
| Compute budget | Remove ComputeBudget instructions (LazorKit handles) |
| Smart wallet | Add to all instruction accounts |

## Devnet Limitations

- Limited liquidity pools
- SOL/USDC pair is most reliable
- Try smaller amounts if "No liquidity" error

## Resources

- [Raydium Trade API Docs](https://docs.raydium.io/raydium/traders/trade-api)
- [Example 04 Full Source](../../examples/04-gasless-raydium-swap/page.tsx)
