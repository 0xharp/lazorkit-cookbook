import { PublicKey, TransactionInstruction } from '@solana/web3.js';

// ============================================================================
// LazorKit Integration Utilities
// ============================================================================
// These utilities are required when integrating external Solana SDKs/protocols
// with LazorKit smart wallets.

/**
 * ComputeBudget program ID
 * LazorKit handles compute budget automatically, so we filter out these instructions
 */
export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey('ComputeBudget111111111111111111111111111111');

/**
 * Add smart wallet to all instructions (LazorKit validation requirement)
 *
 * LazorKit's execute_cpi validates that the smart wallet address is present
 * in ALL instruction account lists. Some instructions (like SyncNative) don't
 * naturally include the wallet, so we add it as a non-signer, non-writable account.
 */
export function addSmartWalletToInstructions(
    instructions: TransactionInstruction[],
    smartWalletAddress: string
): void {
    const walletPubkey = new PublicKey(smartWalletAddress);

    instructions.forEach((ix) => {
        const hasSmartWallet = ix.keys.some(k => k.pubkey.toBase58() === smartWalletAddress);
        if (!hasSmartWallet) {
            ix.keys.push({ pubkey: walletPubkey, isSigner: false, isWritable: false });
        }
    });
}

/**
 * Filter out ComputeBudget instructions
 *
 * LazorKit manages compute budget automatically via its paymaster.
 * External SDKs often add ComputeBudget instructions that conflict with LazorKit.
 */
export function filterComputeBudgetInstructions(
    instructions: TransactionInstruction[]
): TransactionInstruction[] {
    return instructions.filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM_ID));
}

/**
 * Process instructions for LazorKit
 *
 * Combines both required transformations:
 * 1. Filter out ComputeBudget instructions (LazorKit handles compute)
 * 2. Add smart wallet to all instructions (LazorKit validation)
 *
 * @example
 * ```typescript
 * // Get transaction from external SDK (Raydium, Marinade, etc.)
 * const { transaction } = await sdk.buildTransaction(...);
 *
 * // Process for LazorKit
 * const instructions = processInstructionsForLazorKit(
 *   transaction.instructions,
 *   wallet.smartWallet
 * );
 *
 * // Send via LazorKit
 * await signAndSendTransaction({ instructions });
 * ```
 */
export function processInstructionsForLazorKit(
    instructions: TransactionInstruction[],
    smartWalletAddress: string
): TransactionInstruction[] {
    const filtered = filterComputeBudgetInstructions(instructions);
    addSmartWalletToInstructions(filtered, smartWalletAddress);
    return filtered;
}
