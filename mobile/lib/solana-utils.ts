import { Connection, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID, createTransferInstruction } from '@solana/spl-token';
import { RPC_URL, USDC_MINT } from '@/lib/constants';

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Devnet configuration
export const USDC_MINT_PUBKEY = new PublicKey(USDC_MINT);

// Cached connection instance
let _connection: Connection | null = null;

/**
 * Get a shared Solana connection instance (cached)
 */
export function getConnection(rpcUrl: string = RPC_URL): Connection {
    if (!_connection || _connection.rpcEndpoint !== rpcUrl) {
        _connection = new Connection(rpcUrl, 'confirmed');
    }
    return _connection;
}

/**
 * Create a new Solana connection (not cached)
 */
export function createConnection(rpcUrl: string = RPC_URL): Connection {
    return new Connection(rpcUrl, 'confirmed');
}

/**
 * Derive the associated token account address for a given mint and owner
 */
export function getAssociatedTokenAddressSync(
    mint: PublicKey,
    owner: PublicKey,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): PublicKey {
    const [address] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        associatedTokenProgramId
    );
    return address;
}

/**
 * Fetch SOL balance for a wallet
 */
export async function getSolBalance(
    connection: Connection,
    publicKey: PublicKey
): Promise<number> {
    const lamports = await connection.getBalance(publicKey);
    return lamports / LAMPORTS_PER_SOL;
}

/**
 * Fetch USDC balance for a wallet
 */
export async function getUsdcBalance(
    connection: Connection,
    publicKey: PublicKey,
    usdcMint: PublicKey = USDC_MINT_PUBKEY
): Promise<number> {
    try {
        const tokenAccount = getAssociatedTokenAddressSync(usdcMint, publicKey);
        const accountInfo = await connection.getAccountInfo(tokenAccount);

        if (!accountInfo) {
            return 0;
        }

        // Token account layout: mint (32) + owner (32) + amount (8)
        const amount = Number(accountInfo.data.readBigUInt64LE(64));
        // USDC has 6 decimals
        return amount / 1_000_000;
    } catch {
        return 0;
    }
}

/**
 * Fetch both SOL and USDC balances
 */
export async function getBalances(
    connection: Connection,
    publicKey: PublicKey
): Promise<{ sol: number; usdc: number }> {
    const [sol, usdc] = await Promise.all([
        getSolBalance(connection, publicKey),
        getUsdcBalance(connection, publicKey),
    ]);
    return { sol, usdc };
}

/**
 * Shorten a wallet address for display
 */
export function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validate a Solana recipient address
 * @returns Object with valid flag, parsed address (if valid), or error message
 */
export function validateRecipientAddress(recipient: string): {
    valid: boolean;
    address?: PublicKey;
    error?: string;
} {
    if (!recipient || recipient.trim() === '') {
        return { valid: false, error: 'Recipient address is required' };
    }
    try {
        const address = new PublicKey(recipient);
        return { valid: true, address };
    } catch {
        return { valid: false, error: 'Invalid recipient address' };
    }
}

/**
 * Validate a transfer amount against available balance
 * @returns Object with valid flag, parsed amount (if valid), or error message
 */
export function validateTransferAmount(
    amount: string,
    balance: number | null
): { valid: boolean; amountNum?: number; error?: string } {
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (balance !== null && amountNum > balance) {
        return {
            valid: false,
            error: `Insufficient balance. You have ${balance.toFixed(2)} USDC`
        };
    }

    return { valid: true, amountNum };
}

/**
 * Create a formatted success message for a transfer
 */
export function createTransferSuccessMessage(
    amount: number,
    recipient: string,
    options: { gasless?: boolean } = {}
): string {
    const baseMessage =
        `Transfer successful!\n\n` +
        `Sent: ${amount} USDC\n` +
        `To: ${shortenAddress(recipient, 8)}`;

    if (options.gasless) {
        return baseMessage + `\n\nNo gas fees paid!`;
    }

    return baseMessage;
}

// Common Solana/transaction error patterns and their user-friendly messages
const ERROR_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
    { pattern: '0x1', message: 'Insufficient SOL for rent. Get SOL from a Solana Devnet faucet.' },
    { pattern: '0x1783', message: 'Insufficient funds for transfer. Check your USDC balance.' },
    { pattern: /Error processing Instruction.*0x1/i, message: 'Insufficient SOL for transaction fees. Get SOL from a faucet.' },
    { pattern: 'slippage', message: 'Slippage exceeded. Try again or increase slippage tolerance.' },
    { pattern: 'No liquidity', message: 'No liquidity pool found for this pair.' },
    { pattern: /transaction too large/i, message: 'Transaction too large. Try a simpler operation.' },
    { pattern: 'insufficient funds', message: 'Insufficient funds for this transaction.' },
    { pattern: 'blockhash not found', message: 'Transaction expired. Please try again.' },
    { pattern: 'already in use', message: 'Account already exists or is in use.' },
    { pattern: 'custom program error', message: 'Smart contract returned an error.' },
    { pattern: 'WalletSendTransactionError', message: 'Wallet rejected the transaction. Check your balance and try again.' },
];

/**
 * Parse a transaction error and return a user-friendly message
 */
export function parseTransactionError(error: unknown): string {
    const errorMessage = error instanceof Error ? error.message : String(error);

    for (const { pattern, message } of ERROR_PATTERNS) {
        if (typeof pattern === 'string') {
            if (errorMessage.includes(pattern)) {
                return message;
            }
        } else if (pattern.test(errorMessage)) {
            return message;
        }
    }

    return errorMessage || 'Unknown error occurred';
}

/**
 * Format a transaction error for display to user
 */
export function formatTransactionError(error: unknown, operation = 'Transaction'): string {
    const userMessage = parseTransactionError(error);
    return `${operation} failed: ${userMessage}`;
}

/**
 * Build instructions for a USDC transfer, including ATA creation if needed
 */
export async function buildUsdcTransferInstructions(
    connection: Connection,
    senderPubkey: PublicKey,
    recipientPubkey: PublicKey,
    amount: number,
    usdcMint: PublicKey = USDC_MINT_PUBKEY
): Promise<TransactionInstruction[]> {
    const senderTokenAccount = getAssociatedTokenAddressSync(usdcMint, senderPubkey);
    const recipientTokenAccount = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);

    const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
    const instructions: TransactionInstruction[] = [];

    // Create recipient token account if it doesn't exist
    if (!recipientAccountInfo) {
        const createAccountIx = new TransactionInstruction({
            keys: [
                { pubkey: senderPubkey, isSigner: true, isWritable: true },
                { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
                { pubkey: recipientPubkey, isSigner: false, isWritable: false },
                { pubkey: usdcMint, isSigner: false, isWritable: false },
                { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: ASSOCIATED_TOKEN_PROGRAM_ID,
            data: Buffer.from([]),
        });
        instructions.push(createAccountIx);
    }

    // Create transfer instruction (amount in USDC smallest units - 6 decimals)
    const transferIx = createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        senderPubkey,
        Math.floor(amount * 1_000_000), // Convert to smallest units
        [],
        SPL_TOKEN_PROGRAM_ID
    );
    instructions.push(transferIx);

    return instructions;
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelayMs?: number;
        maxDelayMs?: number;
        onRetry?: (attempt: number, error: unknown) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        onRetry
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

            if (onRetry) {
                onRetry(attempt, error);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
