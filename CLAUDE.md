# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

**LazorKit Cookbook** - A collection of practical recipes demonstrating LazorKit SDK integration for Solana dApps. Created for the [Superteam x LazorKit Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux).

The goal is to showcase how LazorKit can be integrated with complex on-chain programs while reducing onboarding friction for end users.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Wallet SDK**: LazorKit `@lazorkit/wallet` v2.0.1
- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor 0.31.1, Rust
- **Tokens**: SPL Token (USDC on Devnet)
- **DEX Integration**: Raydium SDK v2
- **NFT Integration**: Metaplex Umi, Token Metadata, Bubblegum (cNFTs)
- **Staking Integration**: Marinade Finance SDK

## Project Structure

```
lazorkit-cookbook/
├── app/                          # Next.js frontend
│   ├── app/
│   │   ├── examples/
│   │   │   ├── 01-passkey-wallet-basics/   # Passkey auth recipe
│   │   │   ├── 02-gasless-transfer/        # Gasless USDC transfer
│   │   │   ├── 03-subscription-service/    # Subscription billing
│   │   │   │   ├── subscribe/              # Plan selection
│   │   │   │   └── dashboard/              # Subscription management
│   │   │   ├── 04-gasless-raydium-swap/    # DEX swap integration
│   │   │   ├── 05-wallet-adapter-integration/  # Wallet adapter demos
│   │   │   │   ├── anza-adapter/           # Anza Wallet Adapter
│   │   │   │   ├── connectorkit/           # Solana ConnectorKit
│   │   │   │   └── wallet-ui/              # Wallet-UI
│   │   │   ├── 06-nft-minting/             # Regular Metaplex NFT
│   │   │   ├── 07-compressed-nft-minting/  # Gasless cNFT (Bubblegum)
│   │   │   └── 08-marinade-staking/        # Liquid staking with Marinade
│   │   └── api/
│   │       ├── charge-subscriptions/       # Backend charging job
│   │       └── nft-metadata/[mint]/        # NFT metadata API
│   ├── components/
│   │   ├── Header.tsx                      # Navigation with wallet dropdown
│   │   └── Footer.tsx                      # Links and attribution
│   ├── hooks/
│   │   ├── useBalances.ts                  # SOL/USDC balance fetching
│   │   └── useLazorkitWalletConnect.ts     # Wallet connection with error handling
│   ├── lib/
│   │   ├── constants.ts                    # Subscription plans config
│   │   ├── solana-utils.ts                 # Shared Solana utilities
│   │   ├── lazorkit-utils.ts               # LazorKit integration utilities
│   │   ├── nft-utils.ts                    # NFT minting utilities (Metaplex)
│   │   └── program/
│   │       └── subscription-service.ts     # Anchor program helpers
│   ├── scripts/
│   │   └── create-merkle-tree.ts           # Helper to create merkle trees
│   └── providers/
│       └── LazorkitProvider.tsx            # SDK initialization
│
└── program/
    └── subscription-program/               # Anchor smart contract
        └── programs/subscription-program/
            └── src/lib.rs                  # Rust program code
```

## Custom Hooks

### `useLazorkitWalletConnect()`
Wrapper around LazorKit's `useWallet()` with automatic error handling:
- Handles popup blocked errors with user alerts
- Manages loading states (`connecting`)
- Returns: `{ wallet, isConnected, connect, disconnect, connecting, signAndSendTransaction }`

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

const { wallet, isConnected, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
```

### `useBalances(walletAddress)`
Fetches and manages SOL/USDC balances:
- Auto-fetches when wallet connects
- Provides manual refresh via `fetchBalances()`
- Returns: `{ solBalance, usdcBalance, loading, error, fetchBalances, reset }`

```typescript
import { useBalances } from '@/hooks/useBalances';

const { solBalance, usdcBalance, fetchBalances } = useBalances(wallet?.smartWallet);
```

## Utility Functions (`lib/solana-utils.ts`)

| Function | Description |
|----------|-------------|
| `getConnection()` | Returns cached Solana connection |
| `createConnection(rpcUrl)` | Creates new connection (use sparingly) |
| `getAssociatedTokenAddressSync()` | Derives token account address |
| `getSolBalance()` | Fetches SOL balance for address |
| `getUsdcBalance()` | Fetches USDC balance for address |
| `shortenAddress()` | Truncates address for display |
| `parseTransactionError()` | Extracts user-friendly error message |
| `formatTransactionError()` | Formats error for alerts |

## LazorKit Utilities (`lib/lazorkit-utils.ts`)

| Function | Description |
|----------|-------------|
| `addSmartWalletToInstructions()` | Adds smart wallet to all instruction account lists (LazorKit validation) |
| `filterComputeBudgetInstructions()` | Removes ComputeBudget instructions (LazorKit handles compute) |
| `processInstructionsForLazorKit()` | Combined: filter ComputeBudget + add smart wallet |
| `COMPUTE_BUDGET_PROGRAM_ID` | ComputeBudget program address constant |

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Process external SDK instructions for LazorKit
const instructions = processInstructionsForLazorKit(
  transaction.instructions,
  wallet.smartWallet
);
await signAndSendTransaction({ instructions });
```

## NFT Utilities (`lib/nft-utils.ts`)

| Function | Description |
|----------|-------------|
| `createDummySigner()` | Creates dummy signer for Umi (LazorKit handles real signing) |
| `addSmartWalletToInstructions()` | Adds smart wallet to all instructions (LazorKit requirement) |
| `storeNftMetadata()` | Stores metadata via API, returns URI |
| `generateMintId()` | Generates unique mint ID with prefix (`nft-` or `cnft-`) |
| `buildMetaplexInstructions()` | Builds Token Metadata + Master Edition instructions |
| `buildCNftMintInstruction()` | Builds Bubblegum mint instruction for cNFTs |
| `extractCNftAssetId()` | Extracts Asset ID from transaction logs |
| `validateNftMetadata()` | Validates name (≤32 chars) and description (≤200 chars) |

### NFT Constants
```typescript
// Regular NFT
REGULAR_NFT_SYMBOL = 'LKCB'
REGULAR_NFT_IMAGE_PATH = '/LKCB_R_NFT.png'

// Compressed NFT
CNFT_SYMBOL = 'cLKCB'
CNFT_IMAGE_PATH = '/LKCB_C_NFT.png'
DEMO_MERKLE_TREE = 'HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u'  // Devnet
```

## Key Concepts

### LazorKit Integration
- `useWallet()` hook from `@lazorkit/wallet` provides: `wallet`, `isConnected`, `connect`, `disconnect`, `signAndSendTransaction`
- `wallet.smartWallet` contains the user's Solana address
- `signAndSendTransaction({ instructions })` sends gasless transactions via paymaster

### Subscription Program
- **Program ID**: `3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v`
- **PDA Seeds**: `["subscription", user_wallet, merchant_wallet]`
- **Model**: Prepaid (first payment on subscribe)
- **Token Delegation**: User delegates to subscription PDA for automatic recurring charges

### Raydium Integration (Recipe 04)
- Uses Raydium Trade API for swap quotes and transactions
- Requests `txVersion: 'LEGACY'` for compatibility with LazorKit
- Filters out `ComputeBudget` instructions (LazorKit manages compute)
- Adds smart wallet to all instruction key lists (LazorKit validation requirement)

### Wallet Adapter Integration (Recipe 05)
Demonstrates using LazorKit alongside other wallet adapters:

**Anza Wallet Adapter (`anza-adapter/`):**
- Uses `@solana/wallet-adapter-react` with LazorKit adapter
- Standard wallet adapter pattern with LazorKit as one option
- Good for apps that want to support multiple wallet types

**Solana ConnectorKit (`connectorkit/`):**
- Uses `@solana/connector-kit` - Solana's new modular wallet connection
- More flexible than wallet-adapter
- Supports LazorKit alongside Phantom, Solflare, etc.

**Wallet-UI (`wallet-ui/`):**
- Uses `@wallet-ui/react` - pre-built wallet UI components
- Minimal code for wallet connection UI
- LazorKit integrated via connector

```typescript
// Example: Using LazorKit with ConnectorKit
import { useSolanaConnector } from '@solana/connector-kit';
import { LazorKitConnector } from '@lazorkit/connector';

const connectors = [
  new LazorKitConnector({ /* config */ }),
  // ... other connectors
];
```

### Metaplex Integration (Recipe 06 & 07)

**Common Pattern for Umi + LazorKit:**
1. Create dummy signer (Umi needs signer, LazorKit handles actual signing via passkey)
2. Build instructions using Umi builders
3. Convert Umi instructions to Web3.js format using `toWeb3JsInstruction()`
4. Add smart wallet to all instructions (LazorKit validation requirement)
5. Send via `signAndSendTransaction()`

**Regular NFT (Recipe 06):**
- Uses Metaplex Token Metadata program
- Creates 4 accounts: Mint, Token Account, Metadata, Master Edition
- ~0.02 SOL rent required (paymaster covers gas, NOT rent)
- Use `createAccountWithSeed` for PDA wallets (can't use `createAccount`)

**Compressed NFT (Recipe 07):**
- Uses Metaplex Bubblegum program
- Mints to pre-existing merkle tree (no new accounts)
- Truly gasless - paymaster covers everything
- Asset ID extracted from transaction logs (not a mint address)
- View via DAS API or Orb Explorer (standard explorers don't support cNFTs)

```typescript
// Key pattern for Metaplex + LazorKit
const dummySigner = createDummySigner(walletAddress);
umi.use(signerIdentity(dummySigner));

const umiIxs = someMetaplexBuilder(umi, {...}).getInstructions();
const web3Ixs = umiIxs.map(toWeb3JsInstruction);

addSmartWalletToInstructions(web3Ixs, wallet.smartWallet);
await signAndSendTransaction({ instructions: web3Ixs });
```

### Marinade Integration (Recipe 08)

Liquid staking with Marinade Finance, demonstrating DeFi protocol integration:

**Features:**
- **Stake SOL**: Convert SOL to mSOL (liquid staking token)
- **Instant Unstake**: Swap mSOL → SOL via liquidity pool (0.1-3% fee)
- **Delayed Unstake**: Order ticket, claim after epoch (~2 days, 0.1% fee)
- **Ticket Management**: View and claim pending delayed unstake tickets

**Key Addresses (same on devnet & mainnet):**
- mSOL Mint: `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`
- Marinade Program: `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`

**Integration Pattern:**
```typescript
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';

// Initialize Marinade
const config = new MarinadeConfig({
  connection: getConnection(),
  publicKey: new PublicKey(wallet.smartWallet),
});
const marinade = new Marinade(config);

// Get transaction from SDK
const { transaction } = await marinade.deposit(amountLamports);

// Extract and process instructions for LazorKit
const instructions = transaction.instructions;

// Filter ComputeBudget (LazorKit handles these)
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
const filtered = instructions.filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM));

// Add smart wallet to all instructions (LazorKit validation requirement)
filtered.forEach((ix) => {
  if (!ix.keys.some(k => k.pubkey.toBase58() === wallet.smartWallet)) {
    ix.keys.push({ pubkey: new PublicKey(wallet.smartWallet), isSigner: false, isWritable: false });
  }
});

// Send via LazorKit
await signAndSendTransaction({ instructions: filtered });
```

**SDK Methods:**
- `marinade.deposit(lamports)` - Stake SOL, receive mSOL
- `marinade.liquidUnstake(lamports)` - Instant swap mSOL → SOL
- `marinade.orderUnstake(lamports)` - Create delayed unstake ticket
- `marinade.claim(ticketPubkey)` - Claim matured ticket
- `marinade.getDelayedUnstakeTickets(owner)` - Fetch pending tickets
- `marinade.getMarinadeState()` - Get mSOL price and pool info

### Important Constants
- **USDC Mint (Devnet)**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **mSOL Mint (Devnet & Mainnet)**: `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`
- **Merchant Wallet**: `CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv`
- **RPC URL**: `https://api.devnet.solana.com`
- **Demo Merkle Tree (Devnet)**: `HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u` (16,384 cNFT capacity)

## Important Notes

1. **Devnet Only**: The subscription program is deployed on Devnet and is a proof-of-concept
2. **Audit Required**: Program needs security audit before Mainnet deployment
3. **Upgrade Authority**: Can be revoked after audit to make program trustless
4. **No "Production-ready" Claims**: Use "Practical" instead to avoid misleading users
5. **cNFT Viewing**: Compressed NFTs require DAS API (Helius, Triton) or Orb Explorer - standard Solana explorers don't support them
6. **NFT Rent Costs**: Regular NFTs require ~0.02 SOL rent from wallet; cNFTs are truly gasless

## Development Commands

```bash
# Frontend (from /app directory)
npm install
npm run dev           # Start dev server at localhost:3000
npm run build         # Production build

# Anchor Program (from /program/subscription-program)
anchor build          # Build the program
anchor test           # Run tests
anchor deploy         # Deploy to configured network
```

## Environment Variables

Frontend (`app/.env.local`):
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID=3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v
NEXT_PUBLIC_MERCHANT_WALLET=CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv
MERCHANT_KEYPAIR_SECRET=<base64-encoded-keypair>  # For backend charging
```

## Code Style

- TypeScript with strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Comments for complex blockchain logic
- Error handling with user-friendly messages
- Centralized utilities in `lib/solana-utils.ts`
- Custom hooks for reusable logic in `hooks/`
