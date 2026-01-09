# Metaplex NFT Integration

This tutorial shows how to mint NFTs using Metaplex with LazorKit's gasless infrastructure.

## Two Approaches

| Type | Gas Fees | Use Case |
|------|----------|----------|
| **Regular NFT** | Paymaster covers gas | High-value collectibles, 1/1s |
| **Compressed NFT** | Fully gasless | Mass distribution, gaming, loyalty programs |

## Regular NFT Minting (Token Metadata)

### What You'll Build

A minting interface where users create standard Metaplex NFTs with gas fees covered by LazorKit.

### Step 1: Create a Dummy Signer

Metaplex Umi requires a signer interface to build instructions, but LazorKit handles actual signing via passkey. We create a "dummy signer" that satisfies Umi's interface (see [Cookbook Patterns - Metaplex Integration](../03-cookbook-patterns.md#pattern-3-metaplex-umi-integration) for the full explanation):

```typescript
import { publicKey as umiPublicKey, Signer } from '@metaplex-foundation/umi';

function createDummySigner(walletAddress: string): Signer {
  return {
    publicKey: umiPublicKey(walletAddress),
    signMessage: async () => new Uint8Array(64),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
}
```

### Step 2: Build Metaplex Instructions

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createMetadataAccountV3, createMasterEditionV3 } from '@metaplex-foundation/mpl-token-metadata';
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

const buildMetaplexInstructions = (walletAddress: string, mintAddress: string) => {
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  const dummySigner = createDummySigner(walletAddress);
  umi.use(signerIdentity(dummySigner));

  // Build metadata instruction
  const metadataBuilder = createMetadataAccountV3(umi, {
    mint: umiPublicKey(mintAddress),
    mintAuthority: dummySigner,
    payer: dummySigner,
    data: {
      name: 'My NFT',
      symbol: 'LKCB',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [{ address: umiPublicKey(walletAddress), verified: false, share: 100 }],
    },
  });

  // Build master edition instruction
  const masterEditionBuilder = createMasterEditionV3(umi, {
    mint: umiPublicKey(mintAddress),
    updateAuthority: dummySigner,
    mintAuthority: dummySigner,
    payer: dummySigner,
  });

  // Convert to Web3.js format
  return [
    ...metadataBuilder.getInstructions().map(toWeb3JsInstruction),
    ...masterEditionBuilder.getInstructions().map(toWeb3JsInstruction),
  ];
};
```

### Step 3: Create Mint Account with Seed

LazorKit smart wallets use `createAccountWithSeed` for new accounts:

```typescript
const seed = `nft-${Date.now()}`;
const mintAddress = await PublicKey.createWithSeed(
  new PublicKey(wallet.smartWallet),
  seed,
  TOKEN_PROGRAM_ID
);

const createMintIx = SystemProgram.createAccountWithSeed({
  fromPubkey: new PublicKey(wallet.smartWallet),
  newAccountPubkey: mintAddress,
  basePubkey: new PublicKey(wallet.smartWallet),
  seed,
  lamports: rentExemptBalance,
  space: 82,
  programId: TOKEN_PROGRAM_ID,
});
```

### Step 4: Send the Transaction

```typescript
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const handleMint = async () => {
  // Build all instructions
  const instructions = [
    createMintIx,
    initializeMintIx,
    createAtaIx,
    mintToIx,
    ...metaplexInstructions,
  ];

  // Process for LazorKit
  const processed = processInstructionsForLazorKit(instructions, wallet.smartWallet);

  // Send gasless
  const signature = await signAndSendTransaction({
    instructions: processed,
    transactionOptions: { computeUnitLimit: 400_000 }
  });
};
```

---

## Compressed NFT Minting (Bubblegum)

Compressed NFTs are **fully gasless** - no rent costs since they don't create new accounts.

### Step 1: Build Bubblegum Instruction

```typescript
import { mintV1 } from '@metaplex-foundation/mpl-bubblegum';

const buildCNftInstruction = (walletAddress: string, merkleTree: string) => {
  const umi = createUmi(RPC_URL).use(mplBubblegum());
  const dummySigner = createDummySigner(walletAddress);
  umi.use(signerIdentity(dummySigner));

  const mintBuilder = mintV1(umi, {
    leafOwner: umiPublicKey(walletAddress),
    merkleTree: umiPublicKey(merkleTree),
    metadata: {
      name: 'My cNFT',
      symbol: 'cLKCB',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [{ address: umiPublicKey(walletAddress), verified: false, share: 100 }],
    },
  });

  return mintBuilder.getInstructions().map(toWeb3JsInstruction);
};
```

### Step 2: Send and Extract Asset ID

```typescript
const handleCNftMint = async () => {
  const instructions = buildCNftInstruction(wallet.smartWallet, MERKLE_TREE);

  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 400_000 }
  });

  // Extract Asset ID from transaction logs
  const assetId = await extractCNftAssetId(signature);
  console.log('cNFT minted! Asset ID:', assetId);
};
```

### Extracting Asset ID

```typescript
async function extractCNftAssetId(signature: string): Promise<string> {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  for (const log of tx?.meta?.logMessages || []) {
    const match = log.match(/Leaf asset ID: ([1-9A-HJ-NP-Za-km-z]{32,44})/);
    if (match) return match[1];
  }

  return 'Unknown';
}
```

### Viewing Compressed NFTs

Use DAS-compatible explorers:

```
https://orbmarkets.io/address/{ASSET_ID}?network=devnet
```

Or query via DAS API:

```typescript
const response = await fetch('https://devnet.helius-rpc.com/?api-key=YOUR_KEY', {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'getAsset',
    params: { id: assetId }
  })
});
```

## Demo Merkle Tree

This cookbook provides a demo tree on Devnet:

```
Address: HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u
Capacity: 16,384 cNFTs
```

## Resources

- [Example 06 README](../../app/app/examples/06-nft-minting/README.md) - Regular NFT implementation details
- [Example 07 README](../../app/app/examples/07-compressed-nft-minting/README.md) - cNFT implementation details
- [Example 06 Source Code](../../app/app/examples/06-nft-minting/page.tsx)
- [Example 07 Source Code](../../app/app/examples/07-compressed-nft-minting/page.tsx)
- [Live Demo - Regular NFT](https://lazorkit-cookbook.vercel.app/examples/06-nft-minting)
- [Live Demo - cNFT](https://lazorkit-cookbook.vercel.app/examples/07-compressed-nft-minting)
- [Metaplex Token Metadata Docs](https://developers.metaplex.com/token-metadata)
- [Metaplex Bubblegum Docs](https://developers.metaplex.com/bubblegum)
