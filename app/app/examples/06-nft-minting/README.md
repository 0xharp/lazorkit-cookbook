# Recipe 06: Regular Metaplex NFT Minting

**Mint standard NFTs using Metaplex Token Metadata with LazorKit smart wallets**

This recipe demonstrates how to integrate Metaplex's Token Metadata program with LazorKit to mint traditional NFTs. While LazorKit covers gas fees, users still need SOL in their wallet for rent (~0.02 SOL per mint) since regular NFTs create on-chain accounts.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Use Metaplex Umi library with LazorKit smart wallets
- Create dummy signers for Umi instruction building
- Convert Umi instructions to Web3.js format
- Handle LazorKit's smart wallet validation requirements
- Build Metadata and Master Edition accounts for NFTs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REGULAR NFT MINTING FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   User UI   │───▶│  Store Metadata  │───▶│  Get Metadata    │   │
│  │  (Next.js)  │    │  via API         │    │  URI             │   │
│  └─────────────┘    └──────────────────┘    └──────────────────┘   │
│         │                                            │              │
│         ▼                                            ▼              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Build NFT Instructions                           │  │
│  │  1. Create Mint Account (via createAccountWithSeed)          │  │
│  │  2. Initialize Mint (0 decimals)                             │  │
│  │  3. Create Associated Token Account                          │  │
│  │  4. Mint 1 Token                                             │  │
│  │  5. Create Metadata Account (Metaplex)                       │  │
│  │  6. Create Master Edition (Metaplex)                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LazorKit Paymaster                         │  │
│  │  - Signs with passkey (no seed phrase)                       │  │
│  │  - Pays gas fees (but NOT account rent)                      │  │
│  │  - Submits to Solana network                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Completed [Recipe 01](../01-passkey-wallet-basics/README.md) and [Recipe 02](../02-gasless-transfer/README.md)
- Understanding of NFT standards and Metaplex
- ~0.02 SOL in wallet for account rent

---

## Step 1: Install Dependencies

```bash
npm install @metaplex-foundation/mpl-token-metadata \
            @metaplex-foundation/umi-bundle-defaults \
            @metaplex-foundation/umi-web3js-adapters
```

---

## Step 2: Create a Dummy Signer for Umi

Umi requires a signer, but LazorKit handles actual signing via passkey:

```typescript
import { publicKey as umiPublicKey, signerIdentity, Signer } from '@metaplex-foundation/umi';

function createDummySigner(walletAddress: string): Signer {
  return {
    publicKey: umiPublicKey(walletAddress),
    signMessage: async () => new Uint8Array(64),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
}
```

---

## Step 3: Build Metaplex Instructions

Use Umi to build metadata and master edition instructions:

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createMetadataAccountV3,
  createMasterEditionV3,
  mplTokenMetadata,
  findMetadataPda,
  findMasterEditionPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

async function buildMetaplexInstructions(
  walletAddress: string,
  mintAddress: string,
  nftName: string,
  metadataUri: string
): Promise<TransactionInstruction[]> {
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  const dummySigner = createDummySigner(walletAddress);
  umi.use(signerIdentity(dummySigner));

  const mintPublicKey = umiPublicKey(mintAddress);
  const metadata = findMetadataPda(umi, { mint: mintPublicKey });
  const masterEdition = findMasterEditionPda(umi, { mint: mintPublicKey });

  // Build CreateMetadataAccountV3
  const metadataBuilder = createMetadataAccountV3(umi, {
    metadata,
    mint: mintPublicKey,
    mintAuthority: dummySigner,
    payer: dummySigner,
    updateAuthority: umiPublicKey(walletAddress),
    data: {
      name: nftName,
      symbol: 'LKCB',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [{ address: umiPublicKey(walletAddress), verified: false, share: 100 }],
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  });

  // Build CreateMasterEditionV3
  const masterEditionBuilder = createMasterEditionV3(umi, {
    edition: masterEdition,
    mint: mintPublicKey,
    updateAuthority: dummySigner,
    mintAuthority: dummySigner,
    payer: dummySigner,
    metadata,
    maxSupply: 0, // True 1/1 NFT
  });

  // Convert Umi instructions to Web3.js format
  const instructions: TransactionInstruction[] = [];
  for (const ix of metadataBuilder.getInstructions()) {
    instructions.push(toWeb3JsInstruction(ix));
  }
  for (const ix of masterEditionBuilder.getInstructions()) {
    instructions.push(toWeb3JsInstruction(ix));
  }

  return instructions;
}
```

---

## Step 4: Add Smart Wallet to Instructions

LazorKit requires the smart wallet in all instruction key lists:

```typescript
function addSmartWalletToInstructions(
  instructions: TransactionInstruction[],
  smartWalletAddress: string
): void {
  const walletPubkey = new PublicKey(smartWalletAddress);

  instructions.forEach((ix) => {
    const hasSmartWallet = ix.keys.some(
      k => k.pubkey.toBase58() === smartWalletAddress
    );
    if (!hasSmartWallet) {
      ix.keys.push({
        pubkey: walletPubkey,
        isSigner: false,
        isWritable: false
      });
    }
  });
}
```

---

## Step 5: Execute the Mint

```typescript
const handleMint = async () => {
  if (!wallet) return;

  // 1. Store metadata via API
  const mintId = generateMintId('nft');
  const metadataUri = await storeNftMetadata(mintId, {
    name: nftName.trim(),
    description: nftDescription.trim(),
  });

  // 2. Generate mint address using createAccountWithSeed
  const seed = `nft-${Date.now()}`;
  const mintAddress = await PublicKey.createWithSeed(
    new PublicKey(wallet.smartWallet),
    seed,
    TOKEN_PROGRAM_ID
  );

  // 3. Build all instructions (mint account, token account, metaplex)
  const instructions = await buildAllMintInstructions(
    wallet.smartWallet,
    mintAddress.toBase58(),
    seed,
    nftName,
    metadataUri
  );

  // 4. Add smart wallet to all instructions
  addSmartWalletToInstructions(instructions, wallet.smartWallet);

  // 5. Sign and send via LazorKit
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 400_000 },
  });
};
```

---

## Integration Challenges & Solutions

### 1. PDA Wallets Can't Use createAccount
**Problem**: LazorKit smart wallets are PDAs, which can't be used as the `from` account in `createAccount`.
**Solution**: Use `createAccountWithSeed` instead, which works with any wallet.

```typescript
const mintAddress = await PublicKey.createWithSeed(walletPubkey, seed, TOKEN_PROGRAM_ID);
const createMintIx = SystemProgram.createAccountWithSeed({
  fromPubkey: walletPubkey,
  newAccountPubkey: mintAddress,
  basePubkey: walletPubkey,
  seed,
  lamports: rentExemptBalance,
  space: 82, // Mint account size
  programId: TOKEN_PROGRAM_ID,
});
```

### 2. Umi vs Web3.js
**Problem**: Metaplex Umi uses its own instruction format.
**Solution**: Use `@metaplex-foundation/umi-web3js-adapters` to convert.

```typescript
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';
const web3Ix = toWeb3JsInstruction(umiIx);
```

### 3. Rent Costs
**Problem**: LazorKit paymaster covers gas fees but NOT account rent (~0.02 SOL).
**Solution**: User needs SOL in wallet, or use [Recipe 07](../07-compressed-nft-minting/README.md) for truly gasless cNFT minting.

---

## Key Differences from cNFT (Recipe 07)

| Aspect | Regular NFT (Recipe 06) | Compressed NFT (Recipe 07) |
|--------|-------------------------|---------------------------|
| Cost | ~0.02 SOL rent | Gas sponsored by paymaster |
| Accounts | 4 accounts created | 0 accounts created |
| Instructions | 6 instructions | 1 instruction |
| Viewing | Standard explorers | DAS API / Orb Explorer |
| Use Case | High-value collectibles | Mass distribution |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Insufficient funds for rent" | Need ~0.02 SOL in wallet for account creation |
| "Account already in use" | Seed collision - use timestamp + random string |
| "Invalid signer" | Ensure dummy signer publicKey matches wallet |
| "Metadata validation failed" | Name must be ≤32 chars, description ≤200 chars |

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/06-nft-minting](https://lazorkit-cookbook.vercel.app/examples/06-nft-minting)

---

## Resources

- [Metaplex Token Metadata Documentation](https://developers.metaplex.com/token-metadata)
- [Metaplex Umi Documentation](https://developers.metaplex.com/umi)
- [LazorKit SDK Documentation](https://docs.lazorkit.com/)
- [Solana Devnet Faucet](https://faucet.solana.com)

---

## Next Steps

- Explore [Recipe 07: Gasless cNFT Minting](../07-compressed-nft-minting/README.md) for truly gasless NFT minting
- Build your own NFT marketplace with LazorKit!
