# Metaplex NFT Integration

This guide covers integrating Metaplex Token Metadata and Bubblegum with LazorKit for NFT minting.

## Two Approaches

| Type | Gas | Rent | Best For |
|------|-----|------|----------|
| Regular NFT (Example 06) | Paymaster | ~0.02 SOL | High-value collectibles |
| Compressed NFT (Example 07) | Paymaster | None | Mass distribution, gaming |

## Regular NFT (Token Metadata)

**Example**: [06-nft-minting](../../examples/06-nft-minting/README.md)

### The Challenge

LazorKit smart wallets are PDAs, which can't use `SystemProgram.createAccount`. We use `createAccountWithSeed` instead.

### Integration Steps

#### 1. Create Dummy Signer for Umi

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

#### 2. Build Metaplex Instructions

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createMetadataAccountV3, createMasterEditionV3 } from '@metaplex-foundation/mpl-token-metadata';
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

const umi = createUmi(RPC_URL).use(mplTokenMetadata());
const dummySigner = createDummySigner(walletAddress);
umi.use(signerIdentity(dummySigner));

// Build metadata instruction
const metadataBuilder = createMetadataAccountV3(umi, { ... });

// Build master edition instruction
const masterEditionBuilder = createMasterEditionV3(umi, { ... });

// Convert to Web3.js format
const instructions = [
  ...metadataBuilder.getInstructions().map(toWeb3JsInstruction),
  ...masterEditionBuilder.getInstructions().map(toWeb3JsInstruction),
];
```

#### 3. Use createAccountWithSeed for Mint

```typescript
const seed = `nft-${Date.now()}`;
const mintAddress = await PublicKey.createWithSeed(
  new PublicKey(wallet.smartWallet),
  seed,
  TOKEN_PROGRAM_ID
);

const createMintIx = SystemProgram.createAccountWithSeed({
  fromPubkey: walletPubkey,
  newAccountPubkey: mintAddress,
  basePubkey: walletPubkey,
  seed,
  lamports: rentExemptBalance,
  space: 82,
  programId: TOKEN_PROGRAM_ID,
});
```

#### 4. Process and Send

```typescript
import { addSmartWalletToInstructions } from '@/lib/nft-utils';

addSmartWalletToInstructions(instructions, wallet.smartWallet);

await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});
```

---

## Compressed NFT (Bubblegum)

**Example**: [07-compressed-nft-minting](../../examples/07-compressed-nft-minting/README.md)

Compressed NFTs are **truly gasless** - no rent costs because they don't create accounts.

### Integration Steps

#### 1. Build Bubblegum Instruction

```typescript
import { mintV1 } from '@metaplex-foundation/mpl-bubblegum';

const mintBuilder = mintV1(umi, {
  leafOwner: umiPublicKey(walletAddress),
  merkleTree: umiPublicKey(DEMO_MERKLE_TREE),
  metadata: {
    name: nftName,
    symbol: 'cLKCB',
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    collection: none(),
    creators: [{ address: umiPublicKey(walletAddress), verified: false, share: 100 }],
  },
});

const instructions = mintBuilder.getInstructions().map(toWeb3JsInstruction);
```

#### 2. Extract Asset ID from Logs

cNFTs don't have mint addresses - extract the Asset ID from transaction logs:

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

#### 3. View cNFT

Standard explorers don't support cNFTs. Use:

- **Orb Explorer**: `https://orbmarkets.io/address/{ASSET_ID}?network=devnet`
- **DAS API** (Helius, Triton): `getAsset({ id: assetId })`

### Merkle Tree Setup

The demo uses a pre-created tree. To create your own:

```typescript
import { createTree } from '@metaplex-foundation/mpl-bubblegum';

const merkleTree = generateSigner(umi);
await createTree(umi, {
  merkleTree,
  maxDepth: 14,        // 16,384 NFTs
  maxBufferSize: 64,
  public: true,
}).sendAndConfirm(umi);
```

> **Note**: Tree creation requires ~0.5 SOL and a regular keypair (not LazorKit).

## Comparison

| Aspect | Regular NFT | Compressed NFT |
|--------|-------------|----------------|
| User pays | ~0.02 SOL rent | Nothing |
| Accounts created | 4 | 0 |
| Viewing | Standard explorers | DAS API / Orb |
| Mint address | Yes | No (Asset ID) |
| Transfer cost | Standard | Minimal |

## Resources

- [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)
- [Metaplex Bubblegum](https://developers.metaplex.com/bubblegum)
- [Example 06 Source](../../examples/06-nft-minting/page.tsx)
- [Example 07 Source](../../examples/07-compressed-nft-minting/page.tsx)
