'use client';

import Link from 'next/link';
import Image from 'next/image';

const ADAPTERS = [
  {
    id: 'anza-adapter',
    name: 'Anza Wallet Adapter',
    icon: '/icons/anza.png',
    description: 'The official Solana wallet adapter by Anza (formerly Solana Labs). Most widely used in the ecosystem.',
    packages: ['@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
    features: [
      'Industry standard for Solana dApps',
      'Built-in modal with wallet icons',
      'Auto-discovery of installed wallets',
      'Battle-tested in production apps',
    ],
    github: 'https://github.com/anza-xyz/wallet-adapter',
  },
  {
    id: 'wallet-ui',
    name: 'Wallet UI',
    icon: '/icons/walletui.png',
    description: 'A modern, unstyled UI library built on Wallet Standard. Highly customizable with Tailwind CSS.',
    packages: ['@wallet-ui/react'],
    features: [
      'Headless/unstyled components',
      'Full Tailwind CSS integration',
      'Minimalist API design',
      'Built on wallet-standard',
    ],
    github: 'https://github.com/wallet-ui/wallet-ui',
  },
  {
    id: 'connectorkit',
    name: 'ConnectorKit',
    icon: '/icons/connectorkit.png',
    description: 'Solana Foundation\'s official connector kit. Simple hooks-based API for wallet connectivity.',
    packages: ['@solana/connector'],
    features: [
      'Official Solana Foundation package',
      'Minimal bundle size',
      'Simple useConnector/useAccount hooks',
      'Built for wallet-standard',
    ],
    github: 'https://github.com/solana-foundation/connectorkit',
  },
  {
    id: 'unified-wallet-kit',
    name: 'Jupiter Unified Wallet Kit',
    icon: '/icons/jupiter.png',
    description: 'The Swiss Army Knife wallet adapter used by Jupiter and Meteora. Feature-rich with multiple themes.',
    packages: ['@jup-ag/wallet-adapter'],
    features: [
      'Battle-tested by Jupiter & Meteora',
      'Built-in themes (Light, Dark, Jupiter)',
      'Mobile Wallet Adapter support',
      'Auto-reconnect & notifications',
    ],
    github: 'https://github.com/TeamRaccoons/Unified-Wallet-Kit',
  },
];

export default function Recipe05Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
          >
            &larr; Back to Home
          </Link>
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl">🔌</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
                Recipe 05: Wallet Adapter Integration
              </h1>
            </div>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Use LazorKit alongside other wallets with popular Solana wallet adapters
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel - Explanation */}
          <div className="space-y-6 w-full min-w-0">
            {/* Why This Matters */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>💡</span> Why Use Wallet Adapters?
              </h2>

              <div className="space-y-4 text-sm text-gray-300">
                <p>
                  While LazorKit provides an excellent standalone wallet experience with passkeys,
                  many users already have their preferred wallets (Phantom, Solflare, Backpack, etc.).
                </p>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">The Best of Both Worlds:</p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>New users: Onboard instantly with passkeys (no extension needed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Existing users: Connect their preferred wallet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>LazorKit users: Still get gasless transactions via paymaster</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="font-semibold text-yellow-300 mb-2">Key Integration Point:</p>
                  <pre className="text-xs text-yellow-200 bg-black/30 rounded p-2 overflow-x-auto">
{`import { registerLazorkitWallet } from '@lazorkit/wallet';

// Register LazorKit as a wallet-standard wallet
useEffect(() => {
  registerLazorkitWallet({
    rpcUrl: 'https://api.devnet.solana.com',
    portalUrl: 'https://portal.lazor.sh',
    paymasterConfig: {
      paymasterUrl: 'https://kora.devnet.lazorkit.com',
    },
  });
}, []);`}
                  </pre>
                  <p className="text-xs text-yellow-200 mt-2">
                    This registers LazorKit as a discoverable wallet that any wallet-standard compatible adapter can detect.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <div>
                    <p className="font-semibold text-white">Register LazorKit</p>
                    <p className="text-gray-400">Call <code className="text-purple-300">registerLazorkitWallet()</code> on app init to make LazorKit discoverable</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <div>
                    <p className="font-semibold text-white">Setup Wallet Provider</p>
                    <p className="text-gray-400">Wrap your app with the wallet adapter provider of your choice</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <div>
                    <p className="font-semibold text-white">LazorKit Appears as Option</p>
                    <p className="text-gray-400">Users see LazorKit alongside Phantom, Solflare, and other wallets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <div>
                    <p className="font-semibold text-white">Use Standard Hooks</p>
                    <p className="text-gray-400">Use the adapter's hooks (useWallet, etc.) - works the same regardless of which wallet is connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Adapter Cards */}
          <div className="space-y-6 w-full min-w-0">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Choose an Adapter</h2>
              <p className="text-sm text-gray-400 mb-6">
                Each example below demonstrates the same gasless USDC transfer feature,
                but using a different wallet adapter library. Click to try each one!
              </p>

              <div className="space-y-4">
                {ADAPTERS.map((adapter) => (
                  <Link
                    key={adapter.id}
                    href={`/recipes/05-wallet-adapter-integration/${adapter.id}`}
                    className="block bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                        <Image
                            src={adapter.icon}
                            alt={adapter.name}
                            width={32}
                            height={32}
                            className="rounded-md"
                        />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {adapter.name}
                          </h3>
                          <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {adapter.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {adapter.packages.map((pkg) => (
                            <code
                              key={pkg}
                              className="text-xs bg-black/30 text-purple-300 px-2 py-1 rounded"
                            >
                              {pkg}
                            </code>
                          ))}
                        </div>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {adapter.features.slice(0, 2).map((feature, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-green-400">✓</span> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
