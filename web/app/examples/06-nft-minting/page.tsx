'use client';

import { useState } from 'react';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import Link from 'next/link';
import Image from 'next/image';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { getConnection, shortenAddress } from '@/lib/solana-utils';
import {
    NFT_NAME_MAX_LENGTH,
    NFT_DESCRIPTION_MAX_LENGTH,
    REGULAR_NFT_SYMBOL,
    REGULAR_NFT_IMAGE_PATH,
    MintedRegularNft,
    buildMetaplexInstructions,
    addSmartWalletToInstructions,
    storeNftMetadata,
    generateMintId,
    validateNftMetadata,
} from '@/lib/nft-utils';
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getAssociatedTokenAddress,
    MINT_SIZE,
} from '@solana/spl-token';

export default function Recipe06() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const theme = useThemeClasses();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minting, setMinting] = useState(false);
    const [mintedNft, setMintedNft] = useState<MintedRegularNft | null>(null);
    const [error, setError] = useState('');

    const handleMint = async () => {
        if (!wallet) return;

        const validation = validateNftMetadata(name, description);
        if (!validation.valid) {
            setError(validation.error || 'Invalid input');
            return;
        }

        setMinting(true);
        setError('');
        setMintedNft(null);

        try {
            const connection = getConnection();
            const walletPubkey = new PublicKey(wallet.smartWallet);

            // Generate a unique seed for the mint account
            const seed = generateMintId('nft').replace(/-/g, '').slice(0, 32);

            // Derive mint address deterministically from smart wallet + seed
            const mintPubkey = await PublicKey.createWithSeed(
                walletPubkey,
                seed,
                TOKEN_PROGRAM_ID
            );

            // Store metadata on our API first
            const metadataUri = await storeNftMetadata(mintPubkey.toBase58(), {
                name: name.trim(),
                description: description.trim(),
            });

            // Get rent exemption for mint account
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            // Derive ATA - Smart wallet is a PDA (off-curve)
            const associatedTokenAddress = await getAssociatedTokenAddress(
                mintPubkey,
                walletPubkey,
                true // allowOwnerOffCurve
            );

            // Build token instructions
            const instructions: TransactionInstruction[] = [];

            // 1. Create mint account using createAccountWithSeed
            instructions.push(
                SystemProgram.createAccountWithSeed({
                    fromPubkey: walletPubkey,
                    basePubkey: walletPubkey,
                    seed,
                    newAccountPubkey: mintPubkey,
                    lamports,
                    space: MINT_SIZE,
                    programId: TOKEN_PROGRAM_ID,
                })
            );

            // 2. Initialize mint (0 decimals for NFT)
            instructions.push(
                createInitializeMintInstruction(
                    mintPubkey,
                    0,
                    walletPubkey,
                    walletPubkey
                )
            );

            // 3. Create associated token account
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    walletPubkey,
                    associatedTokenAddress,
                    walletPubkey,
                    mintPubkey
                )
            );

            // 4. Mint 1 token
            instructions.push(
                createMintToInstruction(
                    mintPubkey,
                    associatedTokenAddress,
                    walletPubkey,
                    1
                )
            );

            // 5 & 6. Create metadata and master edition using Umi
            const metaplexInstructions = await buildMetaplexInstructions(
                wallet.smartWallet,
                mintPubkey.toBase58(),
                name.trim(),
                metadataUri
            );
            instructions.push(...metaplexInstructions);

            // Add smart wallet to instructions for LazorKit validation
            addSmartWalletToInstructions(instructions, wallet.smartWallet);

            // Send transaction via LazorKit
            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000,
                },
            });

            setMintedNft({
                mintAddress: mintPubkey.toBase58(),
                name: name.trim(),
                description: description.trim(),
                signature,
            });

            setName('');
            setDescription('');

        } catch (err: any) {
            console.error('Minting error:', err);
            setError(err.message || 'Failed to mint NFT');
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className={`min-h-screen ${theme.bgPage}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                    >
                        &larr; Back to Home
                    </Link>
                    <div className="flex items-start gap-3 mb-2">
                        <span className="text-4xl">🎨</span>
                        <div>
                            <h1 className={`text-4xl font-bold ${theme.textPrimary}`}>
                                Regular Metaplex NFT Minting
                            </h1>
                        </div>
                    </div>
                    <p className={theme.textMuted}>
                        Mint standard Metaplex NFTs with Token Metadata and Master Edition
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Info */}
                    <div className="space-y-6">
                        {/* Integration Highlight */}
                        <div className={`${theme.bgCardAlt} rounded-2xl p-6`}>
                            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                <span>🤝</span> LazorKit x Metaplex
                            </h2>
                            <p className={`text-sm ${theme.textSecondary} mb-4`}>
                                Standard Metaplex NFT with full on-chain metadata and Master Edition.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                    <span className={theme.textSecondary}>Full on-chain metadata account</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                    <span className={theme.textSecondary}>Master Edition (1/1 NFT)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                    <span className={theme.textSecondary}>Compatible with all marketplaces</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className={theme.infoYellowTitle}>!</span>
                                    <span className={theme.textSecondary}>Requires ~0.02 SOL for rent (from wallet)</span>
                                </div>
                            </div>
                        </div>

                        {/* Making Metaplex Work with LazorKit */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Making Metaplex Work with LazorKit</h2>
                            <div className={`space-y-4 text-sm ${theme.textSecondary}`}>
                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>1.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Create Dummy Signer for Umi</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        Umi requires a signer, but LazorKit handles signing via passkey:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From lib/nft-utils.ts
function createDummySigner(walletAddress: string): Signer {
  return {
    publicKey: umiPublicKey(walletAddress),
    signMessage: async () => new Uint8Array(64),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>2.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Convert Umi to Web3.js Instructions</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        Use the adapter to get instructions LazorKit can execute:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From lib/nft-utils.ts
import { toWeb3JsInstruction } from
  '@metaplex-foundation/umi-web3js-adapters';

const metadataIxs = createMetadataAccountV3(umi, {...})
  .getInstructions();

for (const ix of metadataIxs) {
  instructions.push(toWeb3JsInstruction(ix));
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>3.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Add Smart Wallet to Instructions</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        LazorKit validation requires wallet in all instructions:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From lib/nft-utils.ts
function addSmartWalletToInstructions(
  instructions: TransactionInstruction[],
  smartWalletAddress: string
): void {
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
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>4.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Sign & Send via LazorKit</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        LazorKit handles signing with passkey and gas sponsorship:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From page.tsx
const { signAndSendTransaction } = useWallet();

const signature = await signAndSendTransaction({
  instructions,
  transactionOptions: {
    computeUnitLimit: 400_000,
  },
});`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>What You'll Learn</h2>
                            <ul className={`space-y-3 text-sm ${theme.textSecondary}`}>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Use Metaplex Umi with LazorKit smart wallets</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Create Token Metadata & Master Edition accounts</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Handle PDA wallets with createAccountWithSeed</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Convert Umi instructions to Web3.js format</span>
                                </li>
                            </ul>
                        </div>

                    </div>

                    {/* Right Panel - Minting Interface */}
                    <div className="space-y-6">
                        <div className={`${theme.bgCard} rounded-2xl p-8`}>
                            {!isConnected ? (
                                <div className="text-center space-y-6">
                                    <div>
                                        <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Connect Your Wallet</h3>
                                        <p className={`${theme.textMuted} text-sm`}>
                                            Use LazorKit smart wallet to mint NFTs
                                        </p>
                                    </div>
                                    <button
                                        onClick={connect}
                                        disabled={connecting}
                                        className={`w-full ${theme.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Mint Regular NFT</h3>
                                        <p className={`${theme.textMuted} text-sm`}>
                                            {shortenAddress(wallet?.smartWallet || '', 4)}
                                        </p>
                                    </div>

                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className={`text-sm ${theme.textSecondary}`}>NFT Name</label>
                                            <span className={`text-xs ${theme.textMuted}`}>
                                                {name.length}/{NFT_NAME_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="My Awesome NFT"
                                            value={name}
                                            onChange={(e) => setName(e.target.value.slice(0, NFT_NAME_MAX_LENGTH))}
                                            className={`w-full ${theme.bgInput} rounded-xl px-4 py-3 ${theme.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500`}
                                            disabled={minting}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className={`text-sm ${theme.textSecondary}`}>Description</label>
                                            <span className={`text-xs ${theme.textMuted}`}>
                                                {description.length}/{NFT_DESCRIPTION_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <textarea
                                            placeholder="Describe your NFT..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value.slice(0, NFT_DESCRIPTION_MAX_LENGTH))}
                                            rows={3}
                                            className={`w-full ${theme.bgInput} rounded-xl px-4 py-3 ${theme.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none`}
                                            disabled={minting}
                                        />
                                    </div>

                                    {/* Cost Notice */}
                                    <div className={`${theme.infoYellow} rounded-xl p-3 text-sm`}>
                                        <span className={theme.infoYellowText}>
                                            <strong className={theme.infoYellowTitle}>Note:</strong> Regular NFTs require ~0.02 SOL for account rent.
                                            This is paid from your smart wallet.
                                        </span>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl p-3 text-sm text-red-700 dark:text-red-200">
                                            {error}
                                        </div>
                                    )}

                                    {/* Mint Button */}
                                    <div className={`${theme.infoBlue} rounded-lg p-4 mb-4`}>
                                        <div className="flex items-start gap-2">
                                            <span className={`${theme.infoBlueTitle} text-lg`}>ℹ️</span>
                                            <div className={`text-xs ${theme.infoBlueText}`}>
                                                <p className={`font-semibold mb-1 ${theme.infoBlueTitle}`}>About the Transaction Preview</p>
                                                <p className="mb-2">
                                                    Your wallet may display unusual token amounts (like large negative numbers) during transaction simulation.
                                                    This is normal and happens because the mint account doesn't exist yet when the wallet tries to preview the transaction.
                                                </p>
                                                <p>
                                                    <strong>Why this happens:</strong> To optimize for gasless UX, we create the mint account, initialize it,
                                                    and add metadata all in a single transaction. The alternative would be splitting this into 2-3 separate
                                                    transactions (each requiring Face ID), which would be slower and less user-friendly.
                                                </p>
                                                <p className="mt-2">
                                                    <strong>Rest assured:</strong> The transaction will execute correctly and your NFT will mint successfully!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleMint}
                                        disabled={minting || !name.trim() || !description.trim()}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {minting ? 'Minting...' : '🎨 Mint Regular NFT'}
                                    </button>

                                    <div className={`text-xs ${theme.textMuted} text-center`}>
                                        Creates 4 accounts • ~0.02 SOL rent • Full Metaplex standard
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Minted NFT Display */}
                        {mintedNft && (
                            <div className="bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-2xl p-6">
                                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                    <span>✅</span> NFT Minted Successfully!
                                </h2>

                                <div className="space-y-4">
                                    {/* NFT Card */}
                                    <div className={`${theme.bgCard} rounded-xl p-4 flex gap-4`}>
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={REGULAR_NFT_IMAGE_PATH}
                                                alt={mintedNft.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`${theme.textPrimary} font-semibold truncate`}>{mintedNft.name}</h3>
                                            <p className={`${theme.textMuted} text-sm line-clamp-2`}>{mintedNft.description}</p>
                                            <p className={`${theme.textAccent} text-xs mt-1`}>{REGULAR_NFT_SYMBOL}</p>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="space-y-2">
                                        <a
                                            href={`https://orbmarkets.io/address/${mintedNft.mintAddress}?network=devnet&cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`block w-full text-center ${theme.bgInput} ${theme.textAccent} border ${theme.borderAccent} hover:bg-opacity-80 py-2 px-4 rounded-lg text-sm transition-colors`}
                                        >
                                            View NFT on Orb Explorer →
                                        </a>
                                        <a
                                            href={`https://orbmarkets.io/tx/${mintedNft.signature}?advanced=true&tab=summary&cluster=devnet&network=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`block w-full text-center ${theme.bgInput} hover:opacity-80 ${theme.textSecondary} py-2 px-4 rounded-lg text-sm transition-colors`}
                                        >
                                            View Transaction →
                                        </a>
                                    </div>

                                    <p className={`text-xs ${theme.textMuted} text-center`}>
                                        Mint: {shortenAddress(mintedNft.mintAddress, 8)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
