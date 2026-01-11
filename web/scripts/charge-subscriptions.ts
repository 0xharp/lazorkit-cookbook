import { Connection, Keypair, Transaction, sendAndConfirmTransaction, TransactionInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Manually load .env.local since Next.js doesn't expose it to scripts
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');

    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found!');
        console.log('Create .env.local with:');
        console.log('NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com');
        console.log('NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID=your_program_id');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            env[key] = value;
        }
    });

    return env;
}

const env = loadEnv();

// Configuration
const RPC_URL = env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = env.NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID;
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

if (!PROGRAM_ID) {
    console.error('❌ NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID not found in .env.local');
    process.exit(1);
}

console.log('📋 Configuration:');
console.log('   RPC:', RPC_URL);
console.log('   Program ID:', PROGRAM_ID);
console.log('');

// Load merchant keypair
const KEYPAIR_PATH = 'scripts/merchant-keypair.json';

if (!fs.existsSync(KEYPAIR_PATH)) {
    console.error('❌ merchant-keypair.json not found!');
    console.log('');
    console.log('Generate one with:');
    console.log('  solana-keygen new --outfile merchant-keypair.json --no-bip39-passphrase');
    console.log('');
    console.log('Then fund it:');
    console.log('  solana airdrop 2 $(solana-keygen pubkey merchant-keypair.json) --url devnet');
    process.exit(1);
}

const MERCHANT_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8')))
);

console.log('🔑 Merchant wallet:', MERCHANT_KEYPAIR.publicKey.toBase58());

const connection = new Connection(RPC_URL, 'confirmed');

function getInstructionDiscriminator(name: string): Buffer {
    const preimage = `global:${name}`;
    const hash = crypto.createHash('sha256').update(preimage).digest();
    return hash.slice(0, 8);
}

function buildChargeInstruction(
    subscriptionPDA: PublicKey,
    userTokenAccount: PublicKey,
    recipientTokenAccount: PublicKey,
    programId: PublicKey
): TransactionInstruction {
    const discriminator = getInstructionDiscriminator('charge_subscription');

    return new TransactionInstruction({
        keys: [
            { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId,
        data: discriminator,
    });
}

async function chargeAllSubscriptions() {
    console.log('🔍 Scanning for subscriptions to charge...\n');

    const programId = new PublicKey(PROGRAM_ID);

    try {
        // Get all subscription accounts
        const accounts = await connection.getProgramAccounts(programId);

        console.log(`✅ Found ${accounts.length} subscription account(s)\n`);

        if (accounts.length === 0) {
            console.log('💡 No subscriptions found. Create one first!');
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        let chargedCount = 0;
        let skippedCount = 0;

        for (const account of accounts) {
            try {
                // Parse subscription data
                const data = account.account.data;

                // Basic size check (should be at least 210 bytes)
                if (data.length < 210) {
                    console.log(`⏭️  Skipping ${account.pubkey.toBase58().slice(0, 8)}... - too small (${data.length} bytes)\n`);
                    skippedCount++;
                    continue;
                }

                // Check Anchor discriminator (first 8 bytes should match subscription discriminator)
                const discriminator = data.slice(0, 8);
                const expectedDiscriminator = crypto.createHash('sha256')
                    .update('account:Subscription')
                    .digest()
                    .slice(0, 8);

                if (!discriminator.equals(expectedDiscriminator)) {
                    console.log(`⏭️  Skipping ${account.pubkey.toBase58().slice(0, 8)}... - wrong discriminator (not a subscription account)\n`);
                    skippedCount++;
                    continue;
                }

                let offset = 8; // Skip discriminator

                const authority = new PublicKey(data.slice(offset, offset + 32));
                offset += 32;

                const recipient = new PublicKey(data.slice(offset, offset + 32));
                offset += 32;

                const userTokenAccount = new PublicKey(data.slice(offset, offset + 32));
                offset += 32;

                const recipientTokenAccount = new PublicKey(data.slice(offset, offset + 32));
                offset += 32;

                const tokenMint = new PublicKey(data.slice(offset, offset + 32));
                offset += 32;

                const amountPerPeriod = Number(data.readBigUInt64LE(offset)) / 1_000_000;
                offset += 8;

                const intervalSeconds = Number(data.readBigInt64LE(offset));
                offset += 8;

                const lastChargeTimestamp = Number(data.readBigInt64LE(offset));
                offset += 8;

                const createdAt = Number(data.readBigInt64LE(offset));
                offset += 8;

                const hasExpiry = data.readUInt8(offset) === 1;
                offset += 1;

                let expiresAt: number | null = null;
                if (hasExpiry) {
                    expiresAt = Number(data.readBigInt64LE(offset));
                    offset += 8;
                }

                const isActive = data.readUInt8(offset) === 1;
                offset += 1;

                const totalCharged = Number(data.readBigUInt64LE(offset)) / 1_000_000;
                offset += 8;

                const bump = data.readUInt8(offset);

                // Validate data makes sense
                if (amountPerPeriod > 1_000_000 || totalCharged > 1_000_000) {
                    console.log(`⏭️  Skipping ${authority.toBase58().slice(0, 8)}... - garbage data (amount too high)\n`);
                    skippedCount++;
                    continue;
                }

                if (intervalSeconds < 0 || intervalSeconds > 365 * 24 * 60 * 60) {
                    console.log(`⏭️  Skipping ${authority.toBase58().slice(0, 8)}... - invalid interval\n`);
                    skippedCount++;
                    continue;
                }

                console.log(`📊 Subscription: ${authority.toBase58().slice(0, 8)}...`);
                console.log(`   Amount: $${amountPerPeriod.toFixed(6)} USDC`);
                console.log(`   Total Charged: $${totalCharged.toFixed(6)} USDC`);
                console.log(`   Active: ${isActive ? '✅ Yes' : '❌ No'}`);

                if (!isActive) {
                    console.log(`   ⏭️  Skipping - inactive\n`);
                    skippedCount++;
                    continue;
                }

                // Check if needs charging
                const timeSinceLastCharge = now - lastChargeTimestamp;
                const canCharge = timeSinceLastCharge >= intervalSeconds;

                const timeRemaining = Math.max(0, intervalSeconds - timeSinceLastCharge);
                const hoursRemaining = Math.floor(timeRemaining / 3600);
                const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);

                console.log(`   Last Charged: ${new Date(lastChargeTimestamp * 1000).toLocaleString()}`);
                console.log(`   Interval: ${Math.floor(intervalSeconds / 86400)} days`);

                if (!canCharge) {
                    console.log(`   ⏭️  Skipping - next charge in ${hoursRemaining}h ${minutesRemaining}m\n`);
                    skippedCount++;
                    continue;
                }

                console.log(`   ⚡ Ready to charge!\n`);
                console.log(`   🔨 Building transaction...`);

                // Build charge instruction
                const instruction = buildChargeInstruction(
                    account.pubkey,
                    userTokenAccount,
                    recipientTokenAccount,
                    programId
                );

                // Create and send transaction (NO LAZORKIT - using traditional keypair!)
                const transaction = new Transaction().add(instruction);
                transaction.feePayer = MERCHANT_KEYPAIR.publicKey;

                const { blockhash } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                console.log(`   📤 Sending transaction...`);

                // Sign with merchant keypair (NO FACE ID!)
                const signature = await sendAndConfirmTransaction(
                    connection,
                    transaction,
                    [MERCHANT_KEYPAIR],
                    { commitment: 'confirmed' }
                );

                console.log(`   ✅ Charged! Signature: ${signature}`);
                console.log(`   🔗 View: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);
                chargedCount++;

            } catch (err: any) {
                console.error(`   ❌ Error:`, err.message);
                console.log('');
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✨ Summary:`);
        console.log(`   ✅ Charged: ${chargedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   📋 Total: ${accounts.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err: any) {
        console.error('❌ Error fetching subscriptions:', err.message);
        process.exit(1);
    }
}

// Run the script
console.log('🚀 Starting automatic subscription charging...\n');

chargeAllSubscriptions()
    .then(() => {
        console.log('\n✅ Done!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Fatal error:', err);
        process.exit(1);
    });