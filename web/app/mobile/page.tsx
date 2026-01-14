'use client';

import Link from 'next/link';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { EXPO_QR_URL } from '../../lib/constants'

export default function MobilePage() {
    const theme = useThemeClasses();

    return (
        <div className={`min-h-screen ${theme.bgPage}`}>
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Back Link */}
                <Link href="/" className={`${theme.textAccent} hover:opacity-80 mb-8 inline-block`}>
                    ← Back to Web Recipes
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">📱</div>
                    <h1 className={`text-4xl md:text-5xl font-bold ${theme.textPrimary} mb-4`}>
                        LazorKit Mobile SDK
                    </h1>
                    <p className={`text-xl ${theme.textSecondary}`}>
                        Test the React Native integration on your device
                    </p>
                </div>

                {/* QR Code Section */}
                <div className={`${theme.bgCard} rounded-2xl p-8 mb-8`}>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* QR Code */}
                        <div className={`bg-white p-4 rounded-xl shadow-sm border ${theme.border}`}>
                            <img
                                src={EXPO_QR_URL}
                                alt="Scan to open in Expo Go"
                                width={200}
                                height={200}
                                className="w-48 h-48"
                            />
                        </div>

                        {/* Instructions */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>
                                Scan to Test on Your Device
                            </h2>
                            <ol className={`space-y-3 ${theme.textSecondary}`}>
                                <li className="flex items-start gap-3">
                                    <span className={`${theme.infoPurple} ${theme.infoPurpleTitle} rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold`}>1</span>
                                    <span>Install <strong className={theme.textPrimary}>Expo Go</strong> from the App Store (iOS) or Play Store (Android)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className={`${theme.infoPurple} ${theme.infoPurpleTitle} rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold`}>2</span>
                                    <span>Scan the <strong className={theme.textPrimary}>QR code</strong> with <strong className={theme.textPrimary}>Expo Go (Android)</strong> or the <strong className={theme.textPrimary}>Camera app (iOS)</strong></span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Mobile Recipes */}
                <div className={`${theme.bgCard} rounded-2xl p-8 mb-8`}>
                    <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6`}>
                        Mobile Recipes Included
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { emoji: '👛', title: '01 - Connect Wallet', desc: 'Passkey authentication with deep linking' },
                            { emoji: '⚡', title: '02 - Gasless Transfer', desc: 'Send USDC without gas fees' },
                            { emoji: '🔄', title: '03 - Raydium Swap', desc: 'DEX integration with gasless swaps' }
                        ].map((recipe, i) => (
                            <div key={i} className={`${theme.bgInput} rounded-xl p-5`}>
                                <div className="text-3xl mb-3">{recipe.emoji}</div>
                                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                                    {recipe.title}
                                </h3>
                                <p className={`text-sm ${theme.textMuted}`}>
                                    {recipe.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile vs Web */}
                <div className={`${theme.bgCta} rounded-2xl p-8 mb-8`}>
                    <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6`}>
                        📱 Mobile vs 🌐 Web: Key Differences
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`border-b ${theme.borderAccent}`}>
                                    <th className={`py-3 px-4 ${theme.textMuted} font-medium`}>Feature</th>
                                    <th className={`py-3 px-4 ${theme.textMuted} font-medium`}>Web</th>
                                    <th className={`py-3 px-4 ${theme.textMuted} font-medium`}>Mobile</th>
                                </tr>
                            </thead>
                            <tbody className={theme.textSecondary}>
                                {[
                                    { feature: 'SDK Package', web: '@lazorkit/wallet', mobile: '@lazorkit/wallet-mobile-adapter' },
                                    { feature: 'Authentication', web: 'Popup window', mobile: 'External browser + deep link' },
                                    { feature: 'Redirect Handling', web: 'Not required', mobile: 'Linking.createURL(...)' },
                                    { feature: 'Transaction Signing', web: 'In-app popup', mobile: 'Opens LazorKit portal, returns via deep link' }
                                ].map((row, i) => (
                                    <tr key={i} className={`border-b ${theme.borderAccent}`}>
                                        <td className={`py-3 px-4 font-medium ${theme.textPrimary}`}>{row.feature}</td>
                                        <td className="py-3 px-4"><code className={theme.textAccent}>{row.web}</code></td>
                                        <td className="py-3 px-4"><code className={theme.textAccent}>{row.mobile}</code></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Code Example */}
                <div className={`${theme.bgCard} rounded-2xl p-8`}>
                    <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>
                        Quick Start Code
                    </h2>
                    <p className={`${theme.textMuted} mb-4`}>
                        Using the LazorKit Mobile SDK directly:
                    </p>

                    <div className={`${theme.codeBlock} rounded-lg p-4 overflow-x-auto`}>
                        <pre className="text-sm">
                            <code>{`import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { wallet, isConnected, connect, signAndSendTransaction } = useWallet();

// Connect with deep link redirect
await connect({
  redirectUrl: Linking.createURL('your/return/path'),
  onSuccess: (wallet) => console.log('Connected:', wallet.smartWallet),
  onFail: (error) => console.error('Failed:', error.message),
});

// Send gasless transaction
const signature = await signAndSendTransaction(
  { instructions, transactionOptions: { computeUnitLimit: 200_000 } },
  { redirectUrl: Linking.createURL('your/return/path') }
);`}</code>
                        </pre>
                    </div>

                    <div className={`mt-4 ${theme.statusSuccess} rounded-lg p-4`}>
                        <p className="text-sm mb-2">
                            💡 The cookbook includes a <strong>WalletContext</strong> wrapper that simplifies redirect handling across screens.
                        </p>
                        <a
                            href="https://github.com/0xharp/lazorkit-cookbook/blob/main/docs/mobile/03-cookbook-patterns.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm ${theme.textAccent} hover:opacity-80 underline`}
                        >
                            📖 Read the Mobile Cookbook Patterns Guide →
                        </a>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-12 text-center">
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/" className={theme.btnSecondary}>
                            ← View Web Recipes
                        </Link>
                        <a
                            href="https://github.com/0xharp/lazorkit-cookbook"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={theme.btnSecondary}
                        >
                            View Source Code
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
