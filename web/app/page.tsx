'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { EXPO_QR_URL } from '../lib/constants'

export default function HomePage() {
    const theme = useThemeClasses();

    return (
        <div className={`min-h-screen ${theme.bgPage}`}>
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <h1 className={`text-4xl md:text-7xl font-bold mb-6 ${theme.textPrimary} flex flex-col md:flex-row items-center justify-center gap-4`}>
                        <Image
                            src={theme.isLazorkit ? "/LazorKitLogoLight.png" : "/LazorKitLogoDark.png"}
                            alt="LazorKit Logo"
                            width={84}
                            height={84}
                            className="object-contain w-20 h-20 md:w-[84px] md:h-[84px]"
                        />
                        <span>
                            <span className={theme.textAccent}>LazorKit</span> Cookbook
                        </span>
                    </h1>
                    <p className={`text-xl md:text-2xl mb-4 ${theme.textSecondary}`}>
                        Real-world examples showing how LazorKit makes Solana development simpler
                    </p>
                    <p className={`text-lg max-w-2xl mx-auto ${theme.textMuted}`}>
                        No more wallet adapters, no gas fee headaches, no blockchain complexity.<br />
                        Just connect with Face ID and build.
                    </p>
                </div>

                {/* Mobile App Section */}
                <div className="max-w-4xl mx-auto mb-16">
                    <Link href="/mobile">
                        <div className={`${theme.bgCardAlt} rounded-2xl p-8 hover:scale-[1.01] transition-all cursor-pointer`}>
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="text-6xl">📱</div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className={`text-2xl font-bold mb-2 ${theme.textPrimary}`}>
                                        Try the Mobile App
                                    </h2>
                                    <p className={`mb-3 ${theme.textSecondary}`}>
                                        Test the LazorKit React Native SDK integration on your iOS or Android device.
                                        Includes 3 mobile recipes with deep linking and gasless transactions.
                                    </p>
                                    <span className={`inline-flex items-center gap-2 font-semibold ${theme.textAccent}`}>
                                        Scan QR Code to Test →
                                    </span>
                                </div>
                                <div className={`hidden md:block p-2 rounded-lg ${theme.isLazorkit ? 'bg-gray-100' : 'bg-white'}`}>
                                    <img
                                        src={EXPO_QR_URL}
                                        alt="Scan to open in Expo Go"
                                        width={80}
                                        height={80}
                                        className="w-20 h-20"
                                    />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recipe Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {[
                        { num: '01', title: 'Passkey Wallet Basics', emoji: '👛', level: '⭐ Beginner', href: '/examples/01-passkey-wallet-basics', desc: 'Create wallets with Face ID, check balances, and request airdrops. Perfect for getting started!', features: ['Passkey authentication', 'Balance checking', 'Devnet airdrops'] },
                        { num: '02', title: 'Gasless USDC Transfer', emoji: '⚡', level: '⭐⭐ Intermediate', href: '/examples/02-gasless-transfer', desc: 'Send USDC without paying gas fees. Learn how LazorKit\'s paymaster enables true gasless transactions.', features: ['Zero gas fees for users', 'SPL token transfers', 'Paymaster integration'] },
                        { num: '03', title: 'Subscription Service', emoji: '💰', level: '⭐⭐⭐⭐ Advanced', href: '/examples/03-subscription-service', desc: 'Practical subscription billing with automatic recurring charges. Full-stack example!', features: ['Automatic billing', 'Token delegation', 'Backend automation'] },
                        { num: '04', title: 'Gasless Raydium Token Swaps', emoji: '🔄', level: '⭐⭐⭐ Advanced', href: '/examples/04-gasless-raydium-swap', desc: 'Integrate with Raydium DEX for gasless token swaps. Learn to work with existing Solana protocols!', features: ['Raydium SDK/API integration', 'Gasless DEX swaps', 'Protocol integration pattern'] },
                        { num: '05', title: 'Wallet Adapter Integration', emoji: '🔌', level: '⭐⭐⭐ Advanced', href: '/examples/05-wallet-adapter-integration', desc: 'Use LazorKit alongside other wallets with popular Solana wallet adapters with an example for transferring USDC!', features: ['4 popular wallet adapters', 'Anza, Jupiter, Wallet UI, ConnectorKit', 'Gasless USDC transfer demo'] },
                        { num: '06', title: 'Regular Metaplex NFT Minting', emoji: '🎨', level: '⭐⭐⭐ Advanced', href: '/examples/06-nft-minting', desc: 'Mint NFTs using Metaplex Token Metadata standard. Learn the traditional approach!', features: ['Metaplex Token Metadata', 'Master Edition NFTs', 'On-chain metadata'] },
                        { num: '07', title: 'Gasless cNFT Minting (Metaplex Bubblegum)', emoji: '🌳', level: '⭐⭐⭐ Advanced', href: '/examples/07-compressed-nft-minting', desc: 'Mint compressed NFTs using Metaplex Bubblegum - truly gasless!', features: ['Bubblegum integration', 'Merkle tree compression', 'Zero rent costs'] },
                        { num: '08', title: 'Liquid Staking with Marinade', emoji: '🥩', level: '⭐⭐⭐ Advanced', href: '/examples/08-marinade-staking', desc: 'Stake SOL for mSOL with Marinade Finance - gas fees sponsored by LazorKit Paymaster!', features: ['Marinade SDK integration', 'Stake SOL & instant unstake', 'Real-time fee quotes'] },
                    ].map((recipe) => (
                        <Link key={recipe.num} href={recipe.href}>
                            <div className={`${theme.bgCard} ${theme.bgCardHover} rounded-2xl p-8 transition-all cursor-pointer group h-full`}>
                                <div className="text-5xl mb-4">{recipe.emoji}</div>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className={`text-2xl font-bold ${theme.textPrimary}`}>Recipe {recipe.num}</span>
                                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-semibold">
                                        {recipe.level}
                                    </span>
                                </div>
                                <h3 className={`text-xl font-semibold mb-3 ${theme.textPrimary}`}>{recipe.title}</h3>
                                <p className={`mb-4 ${theme.textMuted}`}>{recipe.desc}</p>
                                <ul className={`space-y-2 text-sm ${theme.textSecondary}`}>
                                    {recipe.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <span className="text-green-500">✓</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className={`mt-6 font-semibold ${theme.textAccent} group-hover:opacity-80`}>
                                    Start learning →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Why LazorKit Section */}
                <section className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className={`${theme.bgCard} rounded-3xl p-8 md:p-12`}>
                        <h2 className={`text-3xl md:text-4xl font-bold mb-8 text-center ${theme.textPrimary}`}>
                            Why LazorKit Changes Everything
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                            <div>
                                <h3 className="text-xl font-semibold text-red-500 mb-4 flex items-center gap-2">
                                    <span>❌</span> Traditional Solana Development
                                </h3>
                                <ul className={`space-y-3 ${theme.textSecondary}`}>
                                    {['Complex wallet adapter setup', 'Users need SOL for gas fees', 'Managing transaction signing', 'Handling token accounts', 'Building authentication flows'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-red-500 mt-1">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-green-500 mb-4 flex items-center gap-2">
                                    <span>✅</span> With LazorKit
                                </h3>
                                <ul className={`space-y-3 ${theme.textSecondary}`}>
                                    {[
                                        <>One hook: <code className={theme.textAccent}>useWallet()</code></>,
                                        'Gasless transactions via paymaster',
                                        'Smart wallets with Face ID',
                                        'Auto token account creation',
                                        'Simplified transaction flow'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className={`text-xl font-semibold ${theme.textAccent}`}>
                                → Focus on your product, not blockchain complexity
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <div className="max-w-4xl mx-auto mb-16">
                    <h2 className={`text-3xl font-bold text-center mb-8 ${theme.textPrimary}`}>
                        Why Use This Cookbook?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { emoji: '📚', title: 'Progressive Learning', desc: 'Start with basic wallet creation and progress to advanced patterns like token delegation.' },
                            { emoji: '🎯', title: 'Real-World Examples', desc: 'Not just toy demos. Each recipe solves actual problems with detailed code.' },
                            { emoji: '⚡', title: 'Developer-Friendly', desc: 'Clear setup guides, inline comments, and step-by-step tutorials.' },
                            { emoji: '🚀', title: 'No Seed Phrases', desc: 'Users authenticate with Face ID/Touch ID - simple and secure.' },
                        ].map((feature, i) => (
                            <div key={i} className={`${theme.bgCard} rounded-xl p-6`}>
                                <div className="text-3xl mb-3">{feature.emoji}</div>
                                <h3 className={`text-xl font-semibold mb-2 ${theme.textPrimary}`}>{feature.title}</h3>
                                <p className={theme.textMuted}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <div className={`${theme.bgCta} rounded-2xl p-8 max-w-2xl mx-auto`}>
                        <h2 className={`text-3xl font-bold mb-4 ${theme.textPrimary}`}>
                            Ready to Get Started?
                        </h2>
                        <p className={`mb-6 ${theme.textSecondary}`}>
                            Jump into Recipe 01 and create your first passkey wallet in 5 minutes!
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link href="/examples/01-passkey-wallet-basics" className={theme.btnPrimary}>
                                Start with Recipe 01 →
                            </Link>
                            <a href="https://docs.lazorkit.com/" target="_blank" className={theme.btnSecondary}>
                                View LazorKit Docs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
