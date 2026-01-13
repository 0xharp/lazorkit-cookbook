'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import Image from 'next/image';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { shortenAddress } from '@/lib/solana-utils';
import {
    NFT_NAME_MAX_LENGTH,
    NFT_DESCRIPTION_MAX_LENGTH,
    CNFT_SYMBOL,
    CNFT_IMAGE_PATH,
    DEMO_MERKLE_TREE,
    MintedCNft,
    buildCNftMintInstruction,
    storeNftMetadata,
    generateMintId,
    validateNftMetadata,
    extractCNftAssetId,
} from '@/lib/nft-utils';

export default function Recipe07() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const theme = useThemeClasses();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minting, setMinting] = useState(false);
    const [mintedNft, setMintedNft] = useState<MintedCNft | null>(null);
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
            const walletPubkey = new PublicKey(wallet.smartWallet);

            // Store metadata on our API
            const mintId = generateMintId('cnft');
            const metadataUri = await storeNftMetadata(mintId, {
                name: name.trim(),
                description: description.trim(),
            });

            // Build cNFT mint instruction
            const instructions = buildCNftMintInstruction(
                wallet.smartWallet,
                DEMO_MERKLE_TREE,
                name.trim(),
                metadataUri
            );

            // Send via LazorKit (gasless!)
            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000,
                },
            });

            // Extract Asset ID from transaction logs
            const assetId = await extractCNftAssetId(signature);

            setMintedNft({
                assetId,
                treeAddress: DEMO_MERKLE_TREE,
                name: name.trim(),
                description: description.trim(),
                signature,
            });

            setName('');
            setDescription('');

        } catch (err: any) {
            console.error('Minting error:', err);
            setError(err.message || 'Failed to mint cNFT');
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
                        <span className="text-4xl">🌳</span>
                        <div>
                            <h1 className={`text-4xl font-bold ${theme.textPrimary}`}>
                                Gasless cNFT Minting (Metaplex Bubblegum)
                            </h1>
                        </div>
                    </div>
                    <p className={theme.textMuted}>
                        Mint compressed NFTs using Metaplex Bubblegum
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Info */}
                    <div className="space-y-6">
                        {/* Comparison Card */}
                        <div className={`${theme.bgCardAlt} rounded-2xl p-6`}>
                            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                <span>🤝</span> LazorKit x Bubblegum
                            </h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                                    <h3 className="text-red-700 dark:text-red-400 font-semibold mb-2">Regular NFT</h3>
                                    <ul className={`space-y-1 ${theme.textSecondary}`}>
                                        <li>~0.02 SOL per mint</li>
                                        <li>4 accounts created</li>
                                        <li>6 instructions</li>
                                        <li>User pays rent</li>
                                    </ul>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                    <h3 className="text-green-700 dark:text-green-400 font-semibold mb-2">Compressed NFT</h3>
                                    <ul className={`space-y-1 ${theme.textSecondary}`}>
                                        <li>0 accounts created</li>
                                        <li>1 instruction</li>
                                        <li>Gas sponsored by paymaster</li>
                                        <li>Truly gasless!</li>
                                    </ul>
                                </div>
                            </div>
                            <p className={`text-xs ${theme.textMuted} mt-4`}>
                                * Tree creation is a one-time cost paid by the platform
                            </p>
                        </div>

                        {/* Making Bubblegum Work with LazorKit */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Making Bubblegum Work with LazorKit</h2>
                            <div className={`space-y-4 text-sm ${theme.textSecondary}`}>
                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>1.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Build Bubblegum Mint Instruction</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        Use Umi with Bubblegum to mint to a pre-created merkle tree:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From lib/nft-utils.ts
const umi = createUmi(RPC_URL).use(mplBubblegum());
umi.use(signerIdentity(dummySigner));

const mintBuilder = mintV1(umi, {
  leafOwner: umiPublicKey(walletAddress),
  merkleTree: umiPublicKey(merkleTreeAddress),
  metadata: {
    name: nftName,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    collection: none(),
    creators: [{ address, verified: false, share: 100 }],
  },
});`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>2.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Extract Asset ID from Transaction Logs</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        cNFTs don't have mint addresses. Extract Asset ID from logs:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`// From lib/nft-utils.ts
async function extractCNftAssetId(signature: string) {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  for (const log of tx.meta.logMessages) {
    const match = log.match(
      /Leaf asset ID: ([1-9A-HJ-NP-Za-km-z]{32,44})/
    );
    if (match) return match[1];
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>3.</span>
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

                                <div className="mt-4 pt-4">
                                    <p className={`text-xs ${theme.textMuted}`}>
                                        The merkle tree is created once by the platform. Users just mint to it - no accounts created per mint!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>What You'll Learn</h2>
                            <ul className={`space-y-3 text-sm ${theme.textSecondary}`}>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Use Metaplex Bubblegum with LazorKit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Mint to existing merkle trees (zero rent!)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>Extract Asset ID from transaction logs</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                    <span>View cNFTs via DAS-compatible explorers</span>
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
                                            Use LazorKit to mint compressed NFTs for free
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
                                        <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Mint Compressed NFT</h3>
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
                                            placeholder="My Compressed NFT"
                                            value={name}
                                            onChange={(e) => setName(e.target.value.slice(0, NFT_NAME_MAX_LENGTH))}
                                            className={`w-full ${theme.bgInput} rounded-xl px-4 py-3 ${theme.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-500`}
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
                                            className={`w-full ${theme.bgInput} rounded-xl px-4 py-3 ${theme.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none`}
                                            disabled={minting}
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl p-3 text-sm text-red-700 dark:text-red-200">
                                            {error}
                                        </div>
                                    )}

                                    {/* Mint Button */}
                                    <button
                                        onClick={handleMint}
                                        disabled={minting || !name.trim() || !description.trim()}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {minting ? 'Minting...' : '🌳 Mint cNFT (Truly Gas-Free!)'}
                                    </button>

                                    <div className={`text-xs ${theme.textMuted} text-center space-y-1`}>
                                        <div>No rent costs • No account creation • Just sign and mint</div>
                                        <div className="text-green-600 dark:text-green-400 font-semibold">Gas fully sponsored by LazorKit paymaster</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Minted NFT Display */}
                        {mintedNft && (
                            <div className="bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-2xl p-6">
                                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                    <span>✅</span> cNFT Minted Successfully!
                                </h2>

                                <div className="space-y-4">
                                    {/* NFT Card */}
                                    <div className={`${theme.bgCard} rounded-xl p-4 flex gap-4`}>
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={CNFT_IMAGE_PATH}
                                                alt={mintedNft.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`${theme.textPrimary} font-semibold truncate`}>{mintedNft.name}</h3>
                                            <p className={`${theme.textMuted} text-sm line-clamp-2`}>{mintedNft.description}</p>
                                            <p className="text-green-600 dark:text-green-400 text-xs mt-1">{CNFT_SYMBOL} • Compressed</p>
                                        </div>
                                    </div>

                                    {/* Asset ID */}
                                    <div className={`${theme.bgInput} rounded-lg p-3`}>
                                        <div className={`text-xs ${theme.textMuted} mb-1`}>Asset ID</div>
                                        <div className={`text-sm ${theme.textPrimary} font-mono break-all`}>
                                            {mintedNft.assetId}
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="space-y-2">
                                        <a
                                            href={`https://orbmarkets.io/address/${mintedNft.assetId}?network=devnet&cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`block w-full text-center ${theme.bgInput} ${theme.textAccent} border ${theme.borderAccent} hover:bg-opacity-80 py-2 px-4 rounded-lg text-sm transition-colors`}
                                        >
                                            View cNFT on Orb Explorer →
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
                                        Tree: {shortenAddress(mintedNft.treeAddress, 8)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tree Info */}
                        <div className={`${theme.bgCardAlt} rounded-xl p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-600 dark:text-green-400">🌳</span>
                                <span className={`text-sm font-semibold ${theme.textPrimary}`}>Demo Merkle Tree</span>
                            </div>
                            <p className={`text-xs ${theme.textSecondary} font-mono break-all`}>
                                {DEMO_MERKLE_TREE}
                            </p>
                            <p className={`text-xs ${theme.textMuted} mt-2`}>
                                Capacity: 16,384 cNFTs • Shared by all cookbook users
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
