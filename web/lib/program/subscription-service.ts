import { PublicKey, SystemProgram, TransactionInstruction, Connection } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import * as crypto from 'crypto';

export const SUBSCRIPTION_PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID || '3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v'
);

// Circle's USDC on Devnet
export const USDC_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Your merchant wallet
export const MERCHANT_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_MERCHANT_WALLET || 'CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv'
);

export interface CreateSubscriptionParams {
    userWallet: PublicKey;
    amountPerPeriod: number;
    intervalSeconds: number;
    expiresAt?: number;
}

export function getSubscriptionPDA(
    authority: PublicKey,
    recipient: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('subscription'),
            authority.toBuffer(),
            recipient.toBuffer(),
        ],
        SUBSCRIPTION_PROGRAM_ID
    );
}

export function getAssociatedTokenAddressSync(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): PublicKey {
    const [address] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        associatedTokenProgramId
    );
    return address;
}

export function createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
    ];

    const data = Buffer.alloc(0);

    return new TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data,
    });
}

function getInstructionDiscriminator(name: string): Buffer {
    const preimage = `global:${name}`;
    const hash = crypto.createHash('sha256').update(preimage).digest();
    return hash.slice(0, 8);
}

export async function buildInitializeSubscriptionIx(
    params: CreateSubscriptionParams,
    connection: Connection
): Promise<TransactionInstruction[]> {
    const { userWallet, amountPerPeriod, intervalSeconds, expiresAt } = params;

    const instructions: TransactionInstruction[] = [];

    const userTokenAccount = getAssociatedTokenAddressSync(
        USDC_MINT,
        userWallet
    );

    const merchantTokenAccount = getAssociatedTokenAddressSync(
        USDC_MINT,
        MERCHANT_WALLET
    );

    const [subscriptionPDA] = getSubscriptionPDA(userWallet, MERCHANT_WALLET);

    console.log('User token account:', userTokenAccount.toBase58());
    console.log('Merchant token account:', merchantTokenAccount.toBase58());
    console.log('Subscription PDA:', subscriptionPDA.toBase58());

    // Check if subscription already exists
    try {
        const subAccount = await connection.getAccountInfo(subscriptionPDA);
        if (subAccount) {
            throw new Error('Subscription already exists! Please cancel your existing subscription first or use a different plan.');
        }
    } catch (err: any) {
        if (err.message?.includes('already exists')) {
            throw err;
        }
        // Account doesn't exist - this is good, continue
    }

    // Check token accounts
    try {
        const userAccountInfo = await connection.getAccountInfo(userTokenAccount);
        if (!userAccountInfo) {
            console.log('Creating user USDC token account...');
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    userWallet,
                    userTokenAccount,
                    userWallet,
                    USDC_MINT
                )
            );
        } else {
            console.log('User USDC token account exists');
        }
    } catch (err) {
        console.error('Error checking user token account:', err);
    }

    try {
        const merchantAccountInfo = await connection.getAccountInfo(merchantTokenAccount);
        if (!merchantAccountInfo) {
            console.log('Creating merchant USDC token account...');
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    userWallet,
                    merchantTokenAccount,
                    MERCHANT_WALLET,
                    USDC_MINT
                )
            );
        } else {
            console.log('Merchant USDC token account exists');
        }
    } catch (err) {
        console.error('Error checking merchant token account:', err);
    }

    const amountLamports = new BN(amountPerPeriod * 1_000_000);
    const interval = new BN(intervalSeconds);
    const expiry = expiresAt ? new BN(expiresAt) : null;

    const discriminator = getInstructionDiscriminator('initialize_subscription');
    console.log('Discriminator:', discriminator.toString('hex'));

    const subscriptionIx = {
        keys: [
            { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
            { pubkey: userWallet, isSigner: true, isWritable: false },
            { pubkey: MERCHANT_WALLET, isSigner: false, isWritable: false },
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            { pubkey: merchantTokenAccount, isSigner: false, isWritable: true }, // ← FIXED: Made writable for prepaid payment!
            { pubkey: USDC_MINT, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: userWallet, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: SUBSCRIPTION_PROGRAM_ID,
        data: encodeInitializeSubscriptionData(discriminator, amountLamports, interval, expiry),
    };

    instructions.push(new TransactionInstruction(subscriptionIx));

    console.log(`Total instructions: ${instructions.length}`);

    return instructions;
}

function encodeInitializeSubscriptionData(
    discriminator: Buffer,
    amount: BN,
    interval: BN,
    expiresAt: BN | null
): Buffer {
    const amountBuf = amount.toArrayLike(Buffer, 'le', 8);
    const intervalBuf = interval.toArrayLike(Buffer, 'le', 8);

    if (expiresAt) {
        const hasExpiryBuf = Buffer.from([1]);
        const expiryBuf = expiresAt.toArrayLike(Buffer, 'le', 8);
        return Buffer.concat([discriminator, amountBuf, intervalBuf, hasExpiryBuf, expiryBuf]);
    } else {
        const hasExpiryBuf = Buffer.from([0]);
        return Buffer.concat([discriminator, amountBuf, intervalBuf, hasExpiryBuf]);
    }
}

export async function buildCancelSubscriptionIx(
    userWallet: PublicKey
): Promise<TransactionInstruction> {
    const [subscriptionPDA] = getSubscriptionPDA(userWallet, MERCHANT_WALLET);

    const userTokenAccount = getAssociatedTokenAddressSync(
        USDC_MINT,
        userWallet
    );

    const discriminator = getInstructionDiscriminator('cancel_subscription');

    const instruction = {
        keys: [
            { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
            { pubkey: userWallet, isSigner: true, isWritable: true }, // ← Also fixed: authority needs to be writable for rent refund
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: SUBSCRIPTION_PROGRAM_ID,
        data: discriminator,
    };

    return new TransactionInstruction(instruction);
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(
    userWallet: PublicKey,
    connection: Connection
): Promise<boolean> {
    try {
        const [subscriptionPDA] = getSubscriptionPDA(userWallet, MERCHANT_WALLET);
        const account = await connection.getAccountInfo(subscriptionPDA);
        return account !== null;
    } catch {
        return false;
    }
}

export async function getUSDCBalance(userWallet: PublicKey, connection: Connection): Promise<number> {
    try {
        const userTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, userWallet);
        const accountInfo = await connection.getAccountInfo(userTokenAccount);

        if (!accountInfo) {
            return 0;
        }

        // Parse token account data (first 32 bytes = mint, next 32 = owner, then 8 bytes = amount)
        const data = accountInfo.data;
        const amount = Number(data.readBigUInt64LE(64));

        // USDC has 6 decimals on devnet
        return amount / 1_000_000;
    } catch (err) {
        console.error('Error fetching USDC balance:', err);
        return 0;
    }
}

export async function buildCleanupCancelledSubscriptionIx(
    userWallet: PublicKey
): Promise<TransactionInstruction> {
    const [subscriptionPDA] = getSubscriptionPDA(userWallet, MERCHANT_WALLET);

    const discriminator = getInstructionDiscriminator('cleanup_cancelled_subscription');

    const instruction = {
        keys: [
            { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
            { pubkey: userWallet, isSigner: true, isWritable: true },
        ],
        programId: SUBSCRIPTION_PROGRAM_ID,
        data: discriminator,
    };

    return new TransactionInstruction(instruction);
}