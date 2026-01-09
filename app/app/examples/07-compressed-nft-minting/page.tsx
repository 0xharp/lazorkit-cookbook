'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import Image from 'next/image';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
                    >
                        &larr; Back to Home
                    </Link>
                    <div className="flex items-start gap-3 mb-2">
                        <span className="text-4xl">🌳</span>
                        <div>
                            <h1 className="text-4xl font-bold text-white">
                                Gasless cNFT Minting (Metaplex Bubblegum)
                            </h1>
                        </div>
                    </div>
                    <p className="text-gray-400">
                        Mint compressed NFTs using Metaplex Bubblegum
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Info */}
                    <div className="space-y-6">
                        {/* Comparison Card */}
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <span>🤝</span> LazorKit x Bubblegum
                            </h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-red-500/10 rounded-xl p-4">
                                    <h3 className="text-red-400 font-semibold mb-2">Regular NFT</h3>
                                    <ul className="space-y-1 text-gray-300">
                                        <li>~0.02 SOL per mint</li>
                                        <li>4 accounts created</li>
                                        <li>6 instructions</li>
                                        <li>User pays rent</li>
                                    </ul>
                                </div>
                                <div className="bg-green-500/10 rounded-xl p-4">
                                    <h3 className="text-green-400 font-semibold mb-2">Compressed NFT</h3>
                                    <ul className="space-y-1 text-gray-300">
                                        <li>0 accounts created</li>
                                        <li>1 instruction</li>
                                        <li>Gas sponsored by paymaster</li>
                                        <li>Truly gasless!</li>
                                    </ul>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                * Tree creation is a one-time cost paid by the platform
                            </p>
                        </div>

                        {/* Making Bubblegum Work with LazorKit */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Making Bubblegum Work with LazorKit</h2>
                            <div className="space-y-4 text-sm text-gray-300">
                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-yellow-400">1.</span>
                                        <span className="font-semibold text-white">Build Bubblegum Mint Instruction</span>
                                    </div>
                                    <p className="ml-5 text-gray-400 mb-2">
                                        Use Umi with Bubblegum to mint to a pre-created merkle tree:
                                    </p>
                                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
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
                                        <span className="text-yellow-400">2.</span>
                                        <span className="font-semibold text-white">Extract Asset ID from Transaction Logs</span>
                                    </div>
                                    <p className="ml-5 text-gray-400 mb-2">
                                        cNFTs don't have mint addresses. Extract Asset ID from logs:
                                    </p>
                                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
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
                                        <span className="text-yellow-400">3.</span>
                                        <span className="font-semibold text-white">Sign & Send via LazorKit</span>
                                    </div>
                                    <p className="ml-5 text-gray-400 mb-2">
                                        LazorKit handles signing with passkey and gas sponsorship:
                                    </p>
                                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
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

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-gray-400">
                                        The merkle tree is created once by the platform. Users just mint to it - no accounts created per mint!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">What You'll Learn</h2>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Use Metaplex Bubblegum with LazorKit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Mint to existing merkle trees (zero rent!)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Extract Asset ID from transaction logs</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>View cNFTs via DAS-compatible explorers</span>
                                </li>
                            </ul>
                        </div>

                    </div>

                    {/* Right Panel - Minting Interface */}
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
                            {!isConnected ? (
                                <div className="text-center space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
                                        <p className="text-gray-400 text-sm">
                                            Use LazorKit to mint compressed NFTs for free
                                        </p>
                                    </div>
                                    <button
                                        onClick={connect}
                                        disabled={connecting}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Mint Compressed NFT</h3>
                                        <p className="text-gray-400 text-sm">
                                            {shortenAddress(wallet?.smartWallet || '', 4)}
                                        </p>
                                    </div>

                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-300">NFT Name</label>
                                            <span className="text-xs text-gray-500">
                                                {name.length}/{NFT_NAME_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="My Compressed NFT"
                                            value={name}
                                            onChange={(e) => setName(e.target.value.slice(0, NFT_NAME_MAX_LENGTH))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                                            disabled={minting}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-300">Description</label>
                                            <span className="text-xs text-gray-500">
                                                {description.length}/{NFT_DESCRIPTION_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <textarea
                                            placeholder="Describe your NFT..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value.slice(0, NFT_DESCRIPTION_MAX_LENGTH))}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                                            disabled={minting}
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-200">
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

                                    <div className="text-xs text-gray-400 text-center space-y-1">
                                        <div>No rent costs • No account creation • Just sign and mint</div>
                                        <div className="text-green-400">Gas fully sponsored by LazorKit paymaster</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Minted NFT Display */}
                        {mintedNft && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>✅</span> cNFT Minted Successfully!
                                </h2>

                                <div className="space-y-4">
                                    {/* NFT Card */}
                                    <div className="bg-white/5 rounded-xl p-4 flex gap-4">
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={CNFT_IMAGE_PATH}
                                                alt={mintedNft.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold truncate">{mintedNft.name}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{mintedNft.description}</p>
                                            <p className="text-green-400 text-xs mt-1">{CNFT_SYMBOL} • Compressed</p>
                                        </div>
                                    </div>

                                    {/* Asset ID */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-gray-400 mb-1">Asset ID</div>
                                        <div className="text-sm text-white font-mono break-all">
                                            {mintedNft.assetId}
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="space-y-2">
                                        <a
                                            href={`https://orbmarkets.io/address/${mintedNft.assetId}?network=devnet&cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-4 rounded-lg text-sm transition-colors"
                                        >
                                            View cNFT on Orb Explorer →
                                        </a>
                                        <a
                                            href={`https://orbmarkets.io/tx/${mintedNft.signature}?advanced=true&tab=summary&cluster=devnet&network=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center bg-white/5 hover:bg-white/10 text-gray-300 py-2 px-4 rounded-lg text-sm transition-colors"
                                        >
                                            View Transaction →
                                        </a>
                                    </div>

                                    <p className="text-xs text-gray-500 text-center">
                                        Tree: {shortenAddress(mintedNft.treeAddress, 8)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tree Info */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400">🌳</span>
                                <span className="text-sm font-semibold text-white">Demo Merkle Tree</span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono break-all">
                                {DEMO_MERKLE_TREE}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Capacity: 16,384 cNFTs • Shared by all cookbook users
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
