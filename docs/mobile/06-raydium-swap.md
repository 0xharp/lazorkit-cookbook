# Example 03: Raydium Swap

Execute DEX swaps on Raydium without paying gas fees.

## Overview

This example demonstrates:
- Integrating with Raydium Trade API
- Processing external SDK transactions for LazorKit
- Live price quotes with debouncing
- Error handling for devnet pool limitations

## Using the Cookbook's WalletContext

With our `WalletContext` wrapper, the redirect URL is handled automatically:

```typescript
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const { wallet, signAndSendTransaction } = useLazorkitWallet();

// After processing the Raydium transaction...
const instructions = processInstructionsForLazorKit(
    legacyTx.instructions,
    wallet.smartWallet
);

// Just pass the return path
await signAndSendTransaction(
    { instructions, transactionOptions: { computeUnitLimit: 600_000 } },
    'examples/03-raydium-swap'
);
```

## Using LazorKit SDK Directly

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { signAndSendTransaction } = useWallet();

await signAndSendTransaction(
    { instructions, transactionOptions: { computeUnitLimit: 600_000 } },
    { redirectUrl: Linking.createURL('examples/03-raydium-swap') }
);
```

## Key Concepts

### Raydium API Integration

Get swap quotes from Raydium's devnet API:

```typescript
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';

// Get quote
const quoteResponse = await fetch(
  `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
  `inputMint=${inputMint}&outputMint=${outputMint}&` +
  `amount=${amountIn}&slippageBps=50&txVersion=LEGACY`
);

const quoteData = await quoteResponse.json();
const outputAmount = quoteData.data.outputAmount;
```

### Building the Swap Transaction

Request a LEGACY transaction (simpler than versioned):

```typescript
const { data: swapData } = await axios.post(
  `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
  {
    swapResponse: quoteData,
    txVersion: 'LEGACY',  // Important for LazorKit
    wallet: wallet.smartWallet,
    wrapSol: inputMint === SOL_MINT,
    unwrapSol: outputMint === SOL_MINT,
    inputAccount: tokenAccountAddress,
    outputAccount: tokenAccountAddress,
  }
);
```

### Processing for LazorKit

External SDKs add ComputeBudget instructions that conflict with LazorKit's paymaster:

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Deserialize the transaction
const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
const legacyTx = Transaction.from(txBuffer);

// Process for LazorKit:
// 1. Removes ComputeBudget instructions
// 2. Adds smart wallet to all instruction accounts
const instructions = processInstructionsForLazorKit(
  legacyTx.instructions,
  wallet.smartWallet
);

// Send via LazorKit
await signAndSendTransaction({
  instructions,
  transactionOptions: {
    computeUnitLimit: 600_000,  // Swaps need more compute
  },
});
```

### Why Process Instructions?

1. **ComputeBudget Removal**: LazorKit's paymaster handles compute budget. External SDKs add their own which conflicts.

2. **Smart Wallet Addition**: LazorKit's `execute_cpi` validates that the smart wallet is in ALL instruction account lists. Some instructions (like `SyncNative`) don't naturally include it.

```typescript
// What processInstructionsForLazorKit does:
function processInstructionsForLazorKit(instructions, smartWallet) {
  // Filter ComputeBudget
  const filtered = instructions.filter(
    ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM_ID)
  );

  // Add smart wallet to each instruction
  filtered.forEach(ix => {
    const hasWallet = ix.keys.some(k => k.pubkey.equals(smartWallet));
    if (!hasWallet) {
      ix.keys.push({ pubkey: smartWallet, isSigner: false, isWritable: false });
    }
  });

  return filtered;
}
```

### Devnet Limitations

Devnet pools can be unreliable. Handle errors gracefully:

```typescript
if (error.includes('SBF program panicked')) {
  Alert.alert(
    'Pool Error',
    `Try swapping ${outputToken}→${inputToken} instead`
  );
}
```

## Full Example

See the complete implementation at:
[`mobile/app/examples/03-raydium-swap/index.tsx`](../../mobile/app/examples/03-raydium-swap/index.tsx)
