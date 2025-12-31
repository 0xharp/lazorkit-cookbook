'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Transaction } from '@solana/web3.js';
import { ConnectionProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider, UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';

type WalletTheme = 'dark' | 'light' | 'jupiter';
import {
  getConnection,
  buildUsdcTransferInstructions,
  formatTransactionError,
  withRetry,
  validateRecipientAddress,
  validateTransferAmount,
  createTransferSuccessMessage,
} from '@/lib/solana-utils';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function TransferDemo() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { usdcBalance, loading: balanceLoading, fetchBalances } = useBalances(publicKey?.toBase58());
  const {
    recipient, setRecipient,
    amount, setAmount,
    sending,
    retryCount, setRetryCount,
    lastTxSignature, setLastTxSignature,
    resetForm, startSending, stopSending,
  } = useTransferForm();

  const handleSend = async () => {
    if (!publicKey || !recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    const recipientValidation = validateRecipientAddress(recipient);
    if (!recipientValidation.valid) {
      alert(recipientValidation.error);
      return;
    }

    const amountValidation = validateTransferAmount(amount, usdcBalance);
    if (!amountValidation.valid) {
      alert(amountValidation.error);
      return;
    }

    startSending();

    try {
      const signature = await withRetry(
        async () => {
          const conn = getConnection();

          const instructions = await buildUsdcTransferInstructions(
            conn,
            publicKey,
            recipientValidation.address!,
            amountValidation.amountNum!
          );

          const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('finalized');
          const transaction = new Transaction({
            feePayer: publicKey,
            blockhash,
            lastValidBlockHeight,
          });
          transaction.add(...instructions);

          console.log('Sending transaction via Unified Wallet Kit...');
          const sig = await sendTransaction(transaction, connection);
          console.log('Transaction signature:', sig);

          await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

          return sig;
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          onRetry: (attempt, error) => {
            console.log(`Retry attempt ${attempt} after error:`, error);
            setRetryCount(attempt);
          }
        }
      );

      setLastTxSignature(signature);
      alert(createTransferSuccessMessage(amountValidation.amountNum!, recipient));
      resetForm();
      await fetchBalances();
    } catch (err: unknown) {
      console.error('Transfer error:', err);
      alert(formatTransactionError(err, 'Transfer'));
    } finally {
      stopSending();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Try Gasless Transfer</h2>

      {!connected ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">💸</div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Click the button below to open the Unified Wallet modal. LazorKit will appear alongside other installed wallets.
          </p>
          <div className="flex justify-center">
            <UnifiedWalletButton />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div>
              <p className="text-sm text-gray-400">Connected Wallet</p>
              <p className="text-white font-mono text-sm">
                {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
              </p>
            </div>
            <UnifiedWalletButton />
          </div>

          {/* Balance Display */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Your USDC Balance</span>
              <button
                onClick={fetchBalances}
                disabled={balanceLoading}
                className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1"
              >
                <span className={balanceLoading ? 'animate-spin' : ''}>🔄</span>
                {balanceLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="text-3xl font-bold text-white">
              {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Loading...'}
            </div>
            {usdcBalance === 0 && (
              <p className="text-xs text-yellow-400 mt-2">
                No USDC? Get some from{' '}
                <a href="https://faucet.circle.com/" target="_blank" className="underline">
                  Circle Faucet
                </a>
              </p>
            )}
          </div>

          {/* Transfer Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address..."
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
              {usdcBalance !== null && usdcBalance > 0 && (
                <button
                  onClick={() => setAmount(usdcBalance.toString())}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                >
                  Use Max ({usdcBalance.toFixed(2)})
                </button>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !recipient || !amount || usdcBalance === 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {sending
                ? retryCount > 0
                  ? `Retrying... (${retryCount}/3)`
                  : 'Sending...'
                : 'Send USDC'}
            </button>
          </div>

          {/* Gasless Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="text-sm text-blue-200 font-semibold mb-1">
                  Gasless with LazorKit
                </p>
                <p className="text-xs text-blue-200">
                  When connected via LazorKit (passkey), the paymaster covers transaction fees.
                  Other wallets will pay standard SOL fees.
                </p>
              </div>
            </div>
          </div>

          {/* Last Transaction */}
          {lastTxSignature && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">Last Transaction:</p>
              <a
                href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 break-all"
              >
                {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-20)} ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Theme switcher component
function ThemeSwitcher({ theme, setTheme }: { theme: WalletTheme; setTheme: (t: WalletTheme) => void }) {
  const themes: { value: WalletTheme; label: string; color: string }[] = [
    { value: 'dark', label: 'Dark', color: 'bg-gray-900 border-gray-700' },
    { value: 'light', label: 'Light', color: 'bg-white border-gray-300' },
    { value: 'jupiter', label: 'Jupiter', color: 'bg-[rgba(28,41,54,1)]' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Jupiter Unified Wallet Kit Theme</span>
        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === t.value
                  ? 'bg-purple-500/30 border border-purple-500 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className={`w-3 h-3 rounded ${t.color}`}></span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// LazorKit is registered in the parent layout
function UnifiedWalletKitProvider({ children, theme }: { children: React.ReactNode; theme: WalletTheme }) {
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: 'devnet',
          metadata: {
            name: 'LazorKit Cookbook',
            description: 'LazorKit Cookbook - Wallet Adapter Demo',
            url: 'https://lazorkit-cookbook.vercel.app',
            iconUrls: ['https://lazorkit-cookbook.vercel.app/favicon.ico'],
          },
          theme,
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}

export default function UnifiedWalletKitPage() {
  const [theme, setTheme] = useState<WalletTheme>('dark');

  return (
    <UnifiedWalletKitProvider theme={theme}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Link
              href="/recipes/05-wallet-adapter-integration"
              className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
            >
              &larr; Back to Wallet Adapters
            </Link>
            <div className="flex items-center gap-3 mb-2">
                <Image
                    src='/icons/jupiter.png'
                    alt='Jupiter'
                    width={32}
                    height={32}
                    className="rounded-md"
                />
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
                  Jupiter Unified Wallet Kit
                </h1>
              </div>
            </div>
            <p className="text-gray-400 text-sm md:text-base">
              The Swiss Army Knife wallet adapter used by Jupiter and Meteora
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Panel - Code Example */}
            <div className="space-y-6 w-full min-w-0">
              {/* Installation */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Installation</h2>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
{`npm install @jup-ag/wallet-adapter \\
  @lazorkit/wallet`}
                  </pre>
                </div>
              </div>

              {/* Provider Setup */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Provider Setup</h2>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
{`import { useEffect } from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import {
  UnifiedWalletProvider,
  UnifiedWalletButton
} from '@jup-ag/wallet-adapter';
import { registerLazorkitWallet } from '@lazorkit/wallet';

const RPC_URL = 'https://api.devnet.solana.com';

function AppProvider({ children }) {
  // Register LazorKit on mount
  useEffect(() => {
    registerLazorkitWallet({
      rpcUrl: RPC_URL,
      portalUrl: 'https://portal.lazor.sh',
      paymasterConfig: {
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
      },
      clusterSimulation: 'devnet',
    });
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: 'devnet',
          metadata: {
            name: 'My App',
            description: 'My Solana dApp',
            url: 'https://myapp.com',
            iconUrls: ['https://myapp.com/icon.png'],
          },
          theme: 'dark', // 'light', 'dark', or 'jupiter'
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}`}
                  </pre>
                </div>
              </div>

              {/* Using the Hooks */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Using the Hooks</h2>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
{`import { useWallet, useConnection } from
  '@solana/wallet-adapter-react';
import { UnifiedWalletButton } from
  '@jup-ag/wallet-adapter';

function MyComponent() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleSend = async () => {
    // Build your transaction
    const tx = new Transaction().add(...instructions);

    // Send via the adapter (works with any wallet!)
    const signature = await sendTransaction(tx, connection);
    console.log('Sent:', signature);
  };

  return (
    <div>
      {/* Jupiter-styled connect button */}
      <UnifiedWalletButton />

      {connected && (
        <button onClick={handleSend}>Send TX</button>
      )}
    </div>
  );
}`}
                  </pre>
                </div>
              </div>

              {/* Key Points */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Key Points</h2>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Jupiter-powered:</strong> Used by Jupiter and Meteora in production</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Multiple Themes:</strong> Light, Dark, and Jupiter themes built-in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Wallet Standard:</strong> Automatically discovers LazorKit after registration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Mobile Ready:</strong> Built-in Mobile Wallet Adapter support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Gasless for LazorKit:</strong> Paymaster auto-handles gas when using LazorKit</span>
                  </li>
                </ul>
              </div>

              {/* Theme Options */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Theme Options</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded bg-gray-900 border border-gray-700"></span>
                    <code className="text-purple-300">dark</code>
                    <span className="text-gray-400">- Dark theme{theme === 'dark' ? ' (active)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded bg-white border border-gray-300"></span>
                    <code className="text-purple-300">light</code>
                    <span className="text-gray-400">- Light theme{theme === 'light' ? ' (active)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded bg-[rgba(28,41,54,1)]"></span>
                    <code className="text-purple-300">jupiter</code>
                    <span className="text-gray-400">- Jupiter brand theme{theme === 'jupiter' ? ' (active)' : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Demo */}
            <div className="space-y-6 w-full min-w-0 lg:sticky lg:top-8 lg:self-start">
              {/* Theme Switcher */}
              <ThemeSwitcher theme={theme} setTheme={setTheme} />

              <TransferDemo />

              {/* Links */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/TeamRaccoons/Unified-Wallet-Kit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>📚</span> Unified Wallet Kit GitHub
                  </a>
                  <a
                    href="https://www.npmjs.com/package/@jup-ag/wallet-adapter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>📦</span> NPM Package
                  </a>
                  <a
                    href="https://docs.lazorkit.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>🔑</span> LazorKit Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedWalletKitProvider>
  );
}
