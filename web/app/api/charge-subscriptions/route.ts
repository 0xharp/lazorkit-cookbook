import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, sendAndConfirmTransaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import * as crypto from 'crypto';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per minute per IP

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return { allowed: true };
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Increment count
    record.count++;
    return { allowed: true };
}

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
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
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

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

        // Check rate limit
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please wait before trying again.',
                    retryAfter: rateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimit.retryAfter?.toString() || '60',
                    }
                }
            );
        }

        // Load environment variables
        const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
        const PROGRAM_ID = process.env.NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID;
        const MERCHANT_KEYPAIR_SECRET = process.env.MERCHANT_KEYPAIR_SECRET; // Base64 encoded

        if (!RPC_URL || !PROGRAM_ID || !MERCHANT_KEYPAIR_SECRET) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Load merchant keypair from environment
        // MERCHANT_KEYPAIR_SECRET should be base64-encoded JSON array: [1,2,3,...]
        let merchantKeypair: Keypair;
        try {
            const decoded = Buffer.from(MERCHANT_KEYPAIR_SECRET, 'base64').toString('utf-8');
            const secretKeyArray = JSON.parse(decoded);
            merchantKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        } catch (err) {
            console.error('Failed to load merchant keypair:', err);
            return NextResponse.json(
                { error: 'Invalid merchant keypair configuration' },
                { status: 500 }
            );
        }

        const connection = new Connection(RPC_URL, 'confirmed');
        const programId = new PublicKey(PROGRAM_ID);

        console.log('🔍 Scanning for subscriptions...');

        // Get all subscription accounts
        const accounts = await connection.getProgramAccounts(programId);

        const results = {
            total: accounts.length,
            charged: [] as string[],
            skipped: [] as { address: string; reason: string }[],
            errors: [] as { address: string; error: string }[],
        };

        const now = Math.floor(Date.now() / 1000);

        for (const account of accounts) {
            try {
                const data = account.account.data;

                // Validate account
                if (data.length < 210) {
                    results.skipped.push({
                        address: account.pubkey.toBase58(),
                        reason: 'Invalid size',
                    });
                    continue;
                }

                // Check discriminator
                const discriminator = data.slice(0, 8);
                const expectedDiscriminator = crypto.createHash('sha256')
                    .update('account:Subscription')
                    .digest()
                    .slice(0, 8);

                if (!discriminator.equals(expectedDiscriminator)) {
                    results.skipped.push({
                        address: account.pubkey.toBase58(),
                        reason: 'Wrong discriminator',
                    });
                    continue;
                }

                // Parse subscription
                let offset = 8;
                const authority = new PublicKey(data.slice(offset, offset + 32));
                offset += 32 * 4; // Skip recipient, user_token, recipient_token
                const tokenMint = new PublicKey(data.slice(offset, offset + 32));
                offset += 32 + 8; // Skip mint and amount

                const intervalSeconds = Number(data.readBigInt64LE(offset));
                offset += 8;

                const lastChargeTimestamp = Number(data.readBigInt64LE(offset));
                offset += 8 + 8 + 1; // Skip created_at and has_expiry

                // Handle optional expires_at
                const hasExpiry = data.readUInt8(offset - 1) === 1;
                if (hasExpiry) {
                    offset += 8;
                }

                const isActive = data.readUInt8(offset) === 1;

                if (!isActive) {
                    results.skipped.push({
                        address: account.pubkey.toBase58(),
                        reason: 'Inactive',
                    });
                    continue;
                }

                // Check if interval passed
                const timeSinceLastCharge = now - lastChargeTimestamp;
                if (timeSinceLastCharge < intervalSeconds) {
                    results.skipped.push({
                        address: account.pubkey.toBase58(),
                        reason: `Not ready (${Math.ceil((intervalSeconds - timeSinceLastCharge) / 60)}m remaining)`,
                    });
                    continue;
                }

                // Get token accounts
                const userTokenAccount = new PublicKey(data.slice(8 + 64, 8 + 96));
                const recipientTokenAccount = new PublicKey(data.slice(8 + 96, 8 + 128));

                // Build and send transaction
                const instruction = buildChargeInstruction(
                    account.pubkey,
                    userTokenAccount,
                    recipientTokenAccount,
                    programId
                );

                const transaction = new Transaction().add(instruction);
                transaction.feePayer = merchantKeypair.publicKey;

                const { blockhash } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                const signature = await sendAndConfirmTransaction(
                    connection,
                    transaction,
                    [merchantKeypair],
                    { commitment: 'confirmed' }
                );

                results.charged.push(signature);

            } catch (err: any) {
                results.errors.push({
                    address: account.pubkey.toBase58(),
                    error: err.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Charged ${results.charged.length} subscription(s)`,
        });

    } catch (err: any) {
        console.error('Error processing subscriptions:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to process subscriptions' },
            { status: 500 }
        );
    }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000);