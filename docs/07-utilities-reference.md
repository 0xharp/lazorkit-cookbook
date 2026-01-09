# Utilities Reference

This document provides API reference for the hooks and utility functions in the LazorKit Cookbook.

## Hooks

### `useLazorkitWalletConnect()`

Wrapper around LazorKit's `useWallet()` with automatic error handling.

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

const {
  wallet,                   // { smartWallet: string } | null
  isConnected,              // boolean
  connect,                  // () => Promise<void>
  disconnect,               // () => void
  connecting,               // boolean
  signAndSendTransaction,   // (options) => Promise<string>
} = useLazorkitWalletConnect();
```

**Features:**
- Handles popup blocked errors with user alerts
- Manages loading states (`connecting`)
- Provides `signAndSendTransaction` for gasless transactions

---

### `useBalances(walletAddress)`

Fetches and manages SOL/USDC balances.

```typescript
import { useBalances } from '@/hooks/useBalances';

const {
  solBalance,     // number | null
  usdcBalance,    // number | null
  loading,        // boolean
  error,          // Error | null
  fetchBalances,  // () => Promise<void>
  reset,          // () => void
} = useBalances(wallet?.smartWallet);
```

**Features:**
- Auto-fetches when wallet connects
- Provides manual refresh via `fetchBalances()`
- Cached connection for performance

---

### `useTransferForm()`

Manages transfer form state.

```typescript
import { useTransferForm } from '@/hooks/useTransferForm';

const {
  recipient,          // string
  setRecipient,       // (value: string) => void
  amount,             // string
  setAmount,          // (value: string) => void
  sending,            // boolean
  retryCount,         // number
  setRetryCount,      // (value: number) => void
  lastTxSignature,    // string | null
  setLastTxSignature, // (value: string | null) => void
  resetForm,          // () => void
  startSending,       // () => void
  stopSending,        // () => void
} = useTransferForm();
```

---

## Solana Utilities (`lib/solana-utils.ts`)

### Connection

```typescript
import { getConnection, createConnection } from '@/lib/solana-utils';

// Get cached connection (recommended)
const connection = getConnection();

// Create new connection (use sparingly)
const connection = createConnection('https://api.devnet.solana.com');
```

---

### Token Operations

```typescript
import {
  getAssociatedTokenAddressSync,
  getSolBalance,
  getUsdcBalance,
  buildUsdcTransferInstructions,
  USDC_MINT,
} from '@/lib/solana-utils';

// Derive token account address
const ata = getAssociatedTokenAddressSync(USDC_MINT, walletPubkey);

// Fetch balances
const solBalance = await getSolBalance(address);    // number
const usdcBalance = await getUsdcBalance(address);  // number

// Build transfer instructions (handles ATA creation)
const instructions = await buildUsdcTransferInstructions(
  connection,
  senderPubkey,
  recipientPubkey,
  amount  // number (in USDC, e.g., 10.5)
);
```

---

### Validation

```typescript
import {
  validateRecipientAddress,
  validateTransferAmount,
} from '@/lib/solana-utils';

// Validate Solana address
const result = validateRecipientAddress(addressString);
// Returns: { valid: boolean, address?: PublicKey, error?: string }

// Validate amount against balance
const result = validateTransferAmount(amountString, usdcBalance);
// Returns: { valid: boolean, amountNum?: number, error?: string }
```

---

### Error Handling

```typescript
import {
  parseTransactionError,
  formatTransactionError,
} from '@/lib/solana-utils';

// Extract user-friendly error message
const message = parseTransactionError(error);

// Format error for alerts
const alertMessage = formatTransactionError(error, 'Transfer');
// Returns: "Transfer failed: <message>"
```

---

### Retry Logic

```typescript
import { withRetry } from '@/lib/solana-utils';

const signature = await withRetry(
  async () => {
    // Your transaction logic
    return await signAndSendTransaction({ instructions });
  },
  {
    maxRetries: 3,
    initialDelayMs: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error);
    }
  }
);
```

---

### Display Utilities

```typescript
import {
  shortenAddress,
  createTransferSuccessMessage,
} from '@/lib/solana-utils';

// Truncate address for display
shortenAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
// Returns: "4zMM...ncDU"

// Create success message
const message = createTransferSuccessMessage(10.5, recipientAddress, { gasless: true });
// Returns: "Sent 10.5 USDC to 4zMM...ncDU (gasless)"
```

---

## LazorKit Utilities (`lib/lazorkit-utils.ts`)

### Processing External SDK Instructions

```typescript
import {
  processInstructionsForLazorKit,
  filterComputeBudgetInstructions,
  addSmartWalletToInstructions,
  COMPUTE_BUDGET_PROGRAM_ID,
} from '@/lib/lazorkit-utils';

// Full processing (recommended for external SDKs)
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);

// Or step by step:
const filtered = filterComputeBudgetInstructions(transaction.instructions);
addSmartWalletToInstructions(filtered, wallet.smartWallet);
```

**When to use:**
- Integrating Raydium, Marinade, Metaplex, or other external SDKs
- Any transaction built outside of LazorKit

---

## NFT Utilities (`lib/nft-utils.ts`)

### Metaplex Integration

```typescript
import {
  createDummySigner,
  addSmartWalletToInstructions,
  storeNftMetadata,
  generateMintId,
  buildMetaplexInstructions,
  buildCNftMintInstruction,
  extractCNftAssetId,
  validateNftMetadata,
} from '@/lib/nft-utils';

// Create dummy signer for Umi
const signer = createDummySigner(walletAddress);

// Store metadata via API
const uri = await storeNftMetadata(mintId, { name, description });

// Generate unique mint ID
const mintId = generateMintId('nft');   // 'nft-1704067200000-abc123'
const mintId = generateMintId('cnft');  // 'cnft-1704067200000-abc123'

// Validate metadata
const { valid, errors } = validateNftMetadata(name, description);
// name max: 32 chars, description max: 200 chars
```

### NFT Constants

```typescript
import {
  REGULAR_NFT_SYMBOL,    // 'LKCB'
  REGULAR_NFT_IMAGE_PATH, // '/LKCB_R_NFT.png'
  CNFT_SYMBOL,           // 'cLKCB'
  CNFT_IMAGE_PATH,       // '/LKCB_C_NFT.png'
  DEMO_MERKLE_TREE,      // Devnet tree address
} from '@/lib/nft-utils';
```

---

## Constants

### Token Addresses

```typescript
// USDC (Devnet)
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// mSOL (Devnet & Mainnet)
const MSOL_MINT = 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So';
```

### Program IDs

```typescript
// Subscription Program
const SUBSCRIPTION_PROGRAM_ID = '3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v';

// Merchant Wallet
const MERCHANT_WALLET = 'CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv';

// Demo Merkle Tree (cNFTs)
const DEMO_MERKLE_TREE = 'HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u';
```
