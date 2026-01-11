# Recipe 07: Gasless cNFT Minting (Metaplex Bubblegum)

**Mint compressed NFTs with gas fully sponsored by LazorKit paymaster - truly gasless!**

This recipe demonstrates how to integrate Metaplex Bubblegum for compressed NFT minting with LazorKit. Unlike regular NFTs, compressed NFTs (cNFTs) don't create new on-chain accounts, making them truly gasless when combined with LazorKit's paymaster.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Use Metaplex Bubblegum with LazorKit smart wallets
- Mint to pre-existing merkle trees (zero rent costs)
- Extract Asset ID from transaction logs
- View cNFTs via DAS-compatible explorers
- Understand the differences between regular and compressed NFTs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                   COMPRESSED NFT MINTING FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐    │
│  │   User UI   │───▶│  Store Metadata  │───▶│  Get Metadata    │    │
│  │  (Next.js)  │    │  via API         │    │  URI             │    │
│  └─────────────┘    └──────────────────┘    └──────────────────┘    │
│         │                                            │               │
│         ▼                                            ▼               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Build Bubblegum Mint Instruction                 │   │
│  │  - Single mintV1 instruction                                  │   │
│  │  - Targets pre-created merkle tree                           │   │
│  │  - NFT data hashed into tree leaf                            │   │
│  │  - NO new accounts created!                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    LazorKit Paymaster                         │   │
│  │  - Signs with passkey (no seed phrase)                       │   │
│  │  - Pays ALL fees (truly gasless!)                            │   │
│  │  - Submits to Solana network                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Extract Asset ID from Logs                       │   │
│  │  - Parse transaction logs for "Leaf asset ID: <id>"          │   │
│  │  - Use Asset ID to view via DAS API / Orb Explorer           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why Compressed NFTs?

| Aspect | Regular NFT | Compressed NFT |
|--------|-------------|----------------|
| **Cost per mint** | ~0.02 SOL (rent) | Gas sponsored by paymaster |
| **Accounts created** | 4 accounts | 0 accounts |
| **Instructions** | 6 instructions | 1 instruction |
| **User pays** | Rent + Gas | Nothing! |
| **Best for** | High-value 1/1s | Mass distribution, gaming, loyalty |

Compressed NFTs store data in merkle tree leaves instead of separate accounts, reducing costs by ~400x.

---

## Prerequisites

- Completed [Recipe 01](../01-passkey-wallet-basics/README.md) and [Recipe 06](../06-nft-minting/README.md)
- Understanding of merkle trees (conceptual)
- Access to a pre-created merkle tree (demo tree provided)

---

## Step 1: Install Dependencies

```bash
npm install @metaplex-foundation/mpl-bubblegum \
            @metaplex-foundation/umi-bundle-defaults \
            @metaplex-foundation/umi-web3js-adapters
```

---

## Step 2: Build Bubblegum Mint Instruction

Use Umi with Bubblegum to mint to a pre-created merkle tree:

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, mintV1 } from '@metaplex-foundation/mpl-bubblegum';
import { publicKey as umiPublicKey, signerIdentity, none } from '@metaplex-foundation/umi';
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

function buildCNftMintInstruction(
  walletAddress: string,
  merkleTreeAddress: string,
  nftName: string,
  metadataUri: string
): TransactionInstruction[] {
  const umi = createUmi(RPC_URL).use(mplBubblegum());
  const dummySigner = createDummySigner(walletAddress);
  umi.use(signerIdentity(dummySigner));

  const mintBuilder = mintV1(umi, {
    leafOwner: umiPublicKey(walletAddress),
    merkleTree: umiPublicKey(merkleTreeAddress),
    metadata: {
      name: nftName,
      symbol: 'cLKCB',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [
        {
          address: umiPublicKey(walletAddress),
          verified: false,
          share: 100,
        },
      ],
    },
  });

  // Convert to Web3.js instructions
  const instructions: TransactionInstruction[] = [];
  for (const ix of mintBuilder.getInstructions()) {
    instructions.push(toWeb3JsInstruction(ix));
  }

  return instructions;
}
```

---

## Step 3: Extract Asset ID from Transaction Logs

cNFTs don't have mint addresses - they have Asset IDs extracted from logs:

```typescript
async function extractCNftAssetId(signature: string): Promise<string> {
  const connection = getConnection();

  // Wait for transaction to be confirmed
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (tx?.meta?.logMessages) {
    for (const log of tx.meta.logMessages) {
      const match = log.match(/Leaf asset ID: ([1-9A-HJ-NP-Za-km-z]{32,44})/);
      if (match) {
        return match[1];
      }
    }
  }

  return 'Unknown (check transaction logs)';
}
```

---

## Step 4: Execute the Mint

```typescript
const handleMint = async () => {
  if (!wallet) return;

  // 1. Store metadata via API
  const mintId = generateMintId('cnft');
  const metadataUri = await storeNftMetadata(mintId, {
    name: name.trim(),
    description: description.trim(),
  });

  // 2. Build cNFT mint instruction
  const instructions = buildCNftMintInstruction(
    wallet.smartWallet,
    DEMO_MERKLE_TREE,  // Pre-created tree
    name.trim(),
    metadataUri
  );

  // 3. Sign and send via LazorKit (gasless!)
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 400_000 },
  });

  // 4. Extract Asset ID from transaction logs
  const assetId = await extractCNftAssetId(signature);

  console.log('cNFT minted! Asset ID:', assetId);
};
```

---

## Viewing Compressed NFTs

cNFTs require DAS (Digital Asset Standard) API to view:

### Using DAS API directly:
```typescript
const response = await fetch('https://devnet.helius-rpc.com/?api-key=YOUR_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 'my-id',
    method: 'getAsset',
    params: { id: assetId }
  })
});

const { result } = await response.json();
console.log(result.content.metadata);  // name, description
console.log(result.content.links.image);  // image URL
```

### Using Orb Explorer UI:
```
https://orbmarkets.io/address/{ASSET_ID}?network=devnet&cluster=devnet
```

---

## Merkle Tree Setup (For Your Own App)

The demo uses a pre-created tree. To create your own:

```typescript
// scripts/create-merkle-tree.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, createTree } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';

const umi = createUmi(RPC_URL).use(mplBubblegum());
// ... load keypair and set identity

const merkleTree = generateSigner(umi);
await createTree(umi, {
  merkleTree,
  maxDepth: 14,        // 2^14 = 16,384 NFTs
  maxBufferSize: 64,   // Concurrent updates
  public: true,        // Anyone can mint
}).sendAndConfirm(umi);

console.log('Tree address:', merkleTree.publicKey);
```

> **Note**: Tree creation requires ~0.5 SOL and a regular keypair (not LazorKit). This is a one-time platform cost.

---

## Integration Challenges & Solutions

### 1. No Mint Address
**Problem**: cNFTs don't have traditional mint addresses.
**Solution**: Extract Asset ID from transaction logs using regex.

```typescript
const match = log.match(/Leaf asset ID: ([1-9A-HJ-NP-Za-km-z]{32,44})/);
```

### 2. Viewing cNFTs
**Problem**: Standard explorers don't show cNFT details.
**Solution**: Use DAS API or DAS-compatible explorers like Orb Markets.

### 3. Tree Creation
**Problem**: Can't create trees with LazorKit (requires regular keypair).
**Solution**: Platform creates tree once, users mint to it.

---

## Demo Merkle Tree

This cookbook uses a shared demo tree on Devnet:

```
Address: HiTxt5DJMYSpwZ7i3Kx5qzYsuAfEWMZMnyGCNokC7Y2u
Capacity: 16,384 cNFTs
Config: maxDepth=14, maxBufferSize=64, public=true
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Tree not found" | Ensure merkle tree address is correct |
| "Asset ID not found" | Wait longer for transaction confirmation |
| "Can't view NFT" | Use DAS API or Orb Explorer, not standard explorer |
| "Creator shows 0" | Creators can only be verified by signing (limitation) |

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/07-compressed-nft-minting](https://lazorkit-cookbook.vercel.app/examples/07-compressed-nft-minting)

---

## Related Documentation

For step-by-step tutorials and patterns explanation, see the [Cookbook Documentation](../../../../docs/README.md):

- [Metaplex NFT Tutorial](../../../../docs/04-solana-protocols/02-metaplex-nft.md) - Covers both regular and compressed NFTs
- [Cookbook Patterns](../../../../docs/03-cookbook-patterns.md) - Understanding `createDummySigner` and other patterns
- [LazorKit Basics](../../../../docs/02-lazorkit-basics.md) - What the SDK provides natively

## External Resources

- [Metaplex Bubblegum Documentation](https://developers.metaplex.com/bubblegum)
- [Metaplex State Compression Guide](https://developers.metaplex.com/bubblegum/create-trees)
- [Helius DAS API Documentation](https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api)
- [LazorKit SDK Documentation](https://docs.lazorkit.com/)
- [Orb Markets Explorer](https://orbmarkets.io/)

---

## Next Steps

- Compare with [Example 06: Regular NFT Minting](../06-nft-minting/README.md) to understand trade-offs
- Explore [Example 04: Gasless Raydium Swap](../04-gasless-raydium-swap/README.md) for DeFi integration
- See all [Solana Protocol Integrations](../../../../docs/04-solana-protocols/README.md)
- Build your own gasless NFT drop with cNFTs!
