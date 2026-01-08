import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, createTree } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { createSignerFromKeypair } from '@metaplex-foundation/umi';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const RPC_URL = 'https://api.devnet.solana.com';

// Tree configuration
const MAX_DEPTH = 14;        // 2^14 = 16,384 NFTs
const MAX_BUFFER_SIZE = 64;  // Concurrent updates

async function main() {
    console.log('🌳 Merkle Tree Creator for LazorKit Cookbook\n');

    // Get keypair path from args or use default
    const keypairPath = process.argv[2] || path.join(os.homedir(), '.config', 'solana', 'id.json');

    console.log(`Using keypair: ${keypairPath}`);

    // Load keypair
    if (!fs.existsSync(keypairPath)) {
        console.error(`\n❌ Keypair file not found: ${keypairPath}`);
        console.error('\nTo create one:');
        console.error('  solana-keygen new --outfile ~/.config/solana/id.json');
        console.error('\nTo fund it on devnet:');
        console.error('  solana airdrop 1 <address> --url devnet');
        process.exit(1);
    }

    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    const secretKey = Uint8Array.from(keypairData);

    // Create Umi instance
    const umi = createUmi(RPC_URL).use(mplBubblegum());

    // Create keypair from secret
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    console.log(`Wallet address: ${signer.publicKey}`);

    // Check balance
    const balance = await umi.rpc.getBalance(signer.publicKey);
    const solBalance = Number(balance.basisPoints) / 1e9;
    console.log(`Balance: ${solBalance.toFixed(4)} SOL`);

    if (solBalance < 0.5) {
        console.error(`\n❌ Insufficient balance. Need at least 0.5 SOL for tree creation.`);
        console.error(`\nGet devnet SOL:`);
        console.error(`  solana airdrop 1 ${signer.publicKey} --url devnet`);
        process.exit(1);
    }

    console.log(`\nCreating Merkle Tree...`);
    console.log(`  Max Depth: ${MAX_DEPTH} (${Math.pow(2, MAX_DEPTH).toLocaleString()} NFTs)`);
    console.log(`  Buffer Size: ${MAX_BUFFER_SIZE}`);
    console.log(`  Public: true (anyone can mint)`);

    // Generate tree keypair
    const merkleTree = generateSigner(umi);

    console.log(`\n🔑 Tree Address: ${merkleTree.publicKey}`);

    try {
        // Create the tree
        const builder = await createTree(umi, {
            merkleTree,
            maxDepth: MAX_DEPTH,
            maxBufferSize: MAX_BUFFER_SIZE,
            public: true,
        });

        const result = await builder.sendAndConfirm(umi);

        console.log(`\n✅ Tree created successfully!`);
        console.log(`\n📋 Tree Address (copy this):`);
        console.log(`   ${merkleTree.publicKey}`);
        console.log(`\n🔗 Explorer:`);
        console.log(`   https://explorer.solana.com/address/${merkleTree.publicKey}?cluster=devnet`);
        console.log(`\n📝 Next steps:`);
        console.log(`   1. Update DEMO_MERKLE_TREE in app/app/examples/07-compressed-nft-minting/page.tsx`);
        console.log(`   2. Replace 'TREE_ADDRESS_PLACEHOLDER' with the address above`);

    } catch (error: any) {
        console.error(`\n❌ Failed to create tree:`, error.message);
        process.exit(1);
    }
}

main().catch(console.error);
