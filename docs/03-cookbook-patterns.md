# Cookbook Patterns

This guide explains the patterns we created in this cookbook to make LazorKit integration seamless with various Solana protocols. These are reusable patterns you can adopt in your own projects.

## Understanding the Architecture

The LazorKit SDK (`@lazorkit/wallet`) provides the core functionality:
- Passkey-based wallet creation
- Gasless transaction sending via paymaster
- `useWallet()` hook for wallet interactions

This cookbook adds a layer of utilities and patterns on top:

```
Your App
    ↓
┌───────────────────────────────────────────┐
│  Cookbook Patterns (what we built)        │
│  - useLazorkitWalletConnect (hook wrapper)│
│  - processInstructionsForLazorKit         │
│  - createDummySigner (Metaplex pattern)   │
│  - useBalances                            │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│  @lazorkit/wallet (native SDK)            │
│  - LazorkitProvider                       │
│  - useWallet() → signAndSendTransaction() │
│  - Passkey authentication                 │
│  - Paymaster service                      │
└───────────────────────────────────────────┘
    ↓
Solana Network
```

---

## Pattern 1: Wallet Connection Wrapper

### The Challenge
Browser popup blockers can silently prevent the passkey authentication window from appearing. Without handling this, users may click "Connect" and nothing happens - a frustrating experience.

### Our Solution: useLazorkitWalletConnect

We created a wrapper hook around LazorKit's native `useWallet()`:

```typescript
// hooks/useLazorkitWalletConnect.ts
import { useWallet } from '@lazorkit/wallet';

export function useLazorkitWalletConnect() {
  const { connect, disconnect, wallet, isConnected, signAndSendTransaction } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      // Detect popup blocked errors
      if (error instanceof Error && error.message.includes('popup')) {
        alert('Please allow popups for wallet authentication');
      }
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  return {
    wallet,
    isConnected,
    connect: handleConnect,    // Our wrapped version
    disconnect,
    connecting,                // Loading state for UI
    signAndSendTransaction,    // Passed through from LazorKit
  };
}
```

### When to Use This Pattern
- **Always recommended** for better user experience
- Provides a `connecting` boolean for loading states
- Handles edge cases like popup blockers gracefully

### Alternative: Using Native useWallet Directly
You can skip our wrapper and use LazorKit's `useWallet()` directly if you prefer:

```typescript
import { useWallet } from '@lazorkit/wallet';

const { connect, wallet, isConnected, signAndSendTransaction } = useWallet();
```

Just remember to handle your own loading states and error cases.

---

## Pattern 2: External SDK Integration

### The Challenge
When integrating external Solana SDKs (Raydium, Marinade, Jupiter, etc.), you'll encounter two issues:

1. **ComputeBudget Instructions**: External SDKs add their own ComputeBudget instructions. LazorKit's paymaster handles compute budget automatically, so these conflict.

2. **Smart Wallet Validation**: LazorKit's smart wallet architecture requires the wallet address to be present in all instruction account lists. External SDKs don't know about this requirement.

### Our Solution: processInstructionsForLazorKit

This utility handles both issues:

```typescript
// lib/lazorkit-utils.ts
import { TransactionInstruction, PublicKey } from '@solana/web3.js';

const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111');

export function processInstructionsForLazorKit(
  instructions: TransactionInstruction[],
  smartWalletAddress: string
): TransactionInstruction[] {
  const smartWallet = new PublicKey(smartWalletAddress);

  return instructions
    // Step 1: Remove ComputeBudget instructions
    .filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM_ID))
    // Step 2: Add smart wallet to each instruction's accounts
    .map(ix => {
      const hasSmartWallet = ix.keys.some(
        key => key.pubkey.equals(smartWallet)
      );
      if (!hasSmartWallet) {
        ix.keys.push({
          pubkey: smartWallet,
          isSigner: false,
          isWritable: false,
        });
      }
      return ix;
    });
}
```

### Usage Pattern

```typescript
// 1. Get transaction from external SDK
const { transaction } = await raydiumSdk.buildSwapTransaction(params);

// 2. Process for LazorKit
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// 3. Send gasless via LazorKit
const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 600_000 }
});
```

### When to Use This Pattern
- **Integrating Raydium** - DEX swaps
- **Integrating Marinade** - Staking operations
- **Integrating Jupiter** - Swap aggregation
- **Any external Solana SDK** that builds transactions

### When NOT to Use This Pattern
- Building instructions yourself from scratch
- Simple token transfers using SPL token directly
- When you control all the instruction building

---

## Pattern 3: Metaplex Umi Integration

### The Challenge
Metaplex uses Umi, a framework that requires a "signer" interface to build instructions. But with LazorKit, the actual signing happens via passkey in the LazorKit portal - not in your code.

### Our Solution: Dummy Signer Pattern

Create a signer that satisfies Umi's interface but doesn't actually sign anything:

```typescript
// lib/nft-utils.ts
import { createSignerFromKeypair, publicKey as umiPublicKey } from '@metaplex-foundation/umi';

export function createDummySigner(walletAddress: string) {
  return {
    publicKey: umiPublicKey(walletAddress),
    // These methods do nothing - LazorKit handles real signing
    signMessage: async () => new Uint8Array(64),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
}
```

### The Complete Flow

```typescript
// 1. Create Umi instance with dummy signer
const umi = createUmi(rpcUrl);
const dummySigner = createDummySigner(wallet.smartWallet);
umi.use(signerIdentity(dummySigner));

// 2. Build instructions using Umi
const umiInstructions = createNft(umi, {
  mint: mintSigner,
  name: 'My NFT',
  uri: metadataUri,
  // ...
}).getInstructions();

// 3. Convert to web3.js format
const web3Instructions = umiInstructions.map(toWeb3JsInstruction);

// 4. Add smart wallet to all instructions
addSmartWalletToInstructions(web3Instructions, wallet.smartWallet);

// 5. Send via LazorKit (real signing happens here via passkey)
const signature = await signAndSendTransaction({ instructions: web3Instructions });
```

### When to Use This Pattern
- **Minting regular NFTs** with Token Metadata program
- **Minting compressed NFTs** with Bubblegum
- **Any Metaplex operation** that uses Umi

---

## Pattern 4: Balance Management

### The Challenge
Most dApps need to display token balances and refresh them after transactions. This requires:
- Fetching balances on wallet connect
- Manual refresh capability
- Loading states for UI

### Our Solution: useBalances Hook

```typescript
// hooks/useBalances.ts
export function useBalances(walletAddress: string | undefined) {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [sol, usdc] = await Promise.all([
        getSolBalance(connection, new PublicKey(walletAddress)),
        getUsdcBalance(connection, new PublicKey(walletAddress)),
      ]);
      setSolBalance(sol);
      setUsdcBalance(usdc);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Auto-fetch on wallet connect
  useEffect(() => {
    if (walletAddress) fetchBalances();
  }, [walletAddress, fetchBalances]);

  return { solBalance, usdcBalance, loading, fetchBalances };
}
```

### Usage

```typescript
const { wallet } = useLazorkitWalletConnect();
const { solBalance, usdcBalance, fetchBalances, loading } = useBalances(wallet?.smartWallet);

// After a transaction completes
await signAndSendTransaction({ instructions });
await fetchBalances(); // Refresh to show updated balances
```

### When to Use This Pattern
- Any app displaying token balances
- After transactions that modify balances
- When you need loading states for balance fetches

---

## Pattern 5: Error Handling & Retry

### The Challenge
Solana transactions can fail for transient reasons (network congestion, RPC issues). Users shouldn't see cryptic error messages like `0x1783`.

### Our Solution: Error Parsing + Retry Logic

```typescript
// lib/solana-utils.ts
export function parseTransactionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // Map common Solana errors to user-friendly messages
  if (message.includes('0x1')) return 'Insufficient SOL for account rent';
  if (message.includes('0x1783')) return 'Insufficient funds for transfer';
  if (message.includes('slippage')) return 'Price moved too much, try again';
  if (message.includes('blockhash')) return 'Transaction expired, please retry';

  return 'Transaction failed. Please try again.';
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Usage

```typescript
try {
  const signature = await withRetry(
    async () => {
      const instructions = await buildTransferInstructions();
      return signAndSendTransaction({ instructions });
    },
    { maxRetries: 3 }
  );
  console.log('Success:', signature);
} catch (error) {
  alert(parseTransactionError(error));
}
```

### When to Use This Pattern
- Production apps needing robust error handling
- Operations that can fail transiently (network issues)
- Any user-facing transaction

---

## Adopting These Patterns

All utilities are in the `/app/lib/` and `/app/hooks/` directories. You can:

1. **Copy the files directly** into your project
2. **Adapt the patterns** to your specific needs
3. **Reference the examples** in `/app/app/examples/` for complete implementations

Each example in this cookbook demonstrates these patterns in action with real protocols.

## Next Steps

- [Getting Started](01-getting-started.md) - Set up your environment
- [Solana Protocols](04-solana-protocols/README.md) - See these patterns in action
- [Custom Programs](05-custom-programs/README.md) - Build your own Anchor programs
- [Utilities Reference](07-utilities-reference.md) - Full API documentation
