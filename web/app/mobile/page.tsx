import Link from 'next/link';
import { EXPO_QR_URL } from '../../lib/constants'

export default function MobilePage() {

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Back Link */}
                <Link
                    href="/"
                    className="text-purple-400 hover:text-purple-300 mb-8 inline-block"
                >
                    ← Back to Web Recipes
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">📱</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        LazorKit Mobile SDK
                    </h1>
                    <p className="text-xl text-gray-300">
                        Test the React Native integration on your device
                    </p>
                </div>

                {/* QR Code Section */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-xl">
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
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Scan to Test on Your Device
                            </h2>
                            <ol className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                                    <span>Install <strong className="text-white">Expo Go</strong> from the App Store (iOS) or Play Store (Android)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                                    <span>Open Expo Go and tap <strong className="text-white">"Scan QR Code"</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                                    <span>Point your camera at the QR code above</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Mobile Recipes */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Mobile Recipes Included
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="text-3xl mb-3">👛</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                01 - Connect Wallet
                            </h3>
                            <p className="text-sm text-gray-400">
                                Passkey authentication with deep linking
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="text-3xl mb-3">⚡</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                02 - Gasless Transfer
                            </h3>
                            <p className="text-sm text-gray-400">
                                Send USDC without gas fees
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="text-3xl mb-3">🔄</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                03 - Raydium Swap
                            </h3>
                            <p className="text-sm text-gray-400">
                                DEX integration with gasless swaps
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile vs Web */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        📱 Mobile vs 🌐 Web: Key Differences
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-3 px-4 text-gray-400 font-medium">Feature</th>
                                    <th className="py-3 px-4 text-gray-400 font-medium">Web</th>
                                    <th className="py-3 px-4 text-gray-400 font-medium">Mobile</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4 font-medium text-white">SDK Package</td>
                                    <td className="py-3 px-4"><code className="text-purple-400">@lazorkit/wallet</code></td>
                                    <td className="py-3 px-4"><code className="text-purple-400">@lazorkit/wallet-mobile-adapter</code></td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4 font-medium text-white">Authentication</td>
                                    <td className="py-3 px-4">Popup window</td>
                                    <td className="py-3 px-4">External browser + deep link</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4 font-medium text-white">Redirect Handling</td>
                                    <td className="py-3 px-4">Not required</td>
                                    <td className="py-3 px-4"><code className="text-purple-400">redirectUrl: Linking.createURL(...)</code></td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-medium text-white">Transaction Signing</td>
                                    <td className="py-3 px-4">In-app popup</td>
                                    <td className="py-3 px-4">Opens LazorKit portal, returns via deep link</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Code Example */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Quick Start Code
                    </h2>
                    <p className="text-gray-400 mb-4">
                        Using the LazorKit Mobile SDK directly:
                    </p>

                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
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

                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-sm text-green-300 mb-2">
                            💡 The cookbook includes a <strong>WalletContext</strong> wrapper that simplifies redirect handling across screens.
                        </p>
                        <a
                            href="https://github.com/0xharp/lazorkit-cookbook/blob/main/docs/mobile/05-cookbook-patterns.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-400 hover:text-green-300 underline"
                        >
                            📖 Read the Mobile Cookbook Patterns Guide →
                        </a>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-12 text-center">
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all"
                        >
                            ← View Web Recipes
                        </Link>
                        <a
                            href="https://github.com/0xharp/lazorkit-cookbook"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all"
                        >
                            View Source Code
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
