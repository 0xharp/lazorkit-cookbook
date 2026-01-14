'use client';

import { useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useBalances } from '@/hooks/useBalances';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { getConnection } from '@/lib/solana-utils';

export default function Recipe01Page() {
  const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();
  const [airdropping, setAirdropping] = useState(false);
  const theme = useThemeClasses();

  const {
    solBalance,
    usdcBalance,
    loading: refreshing,
    fetchBalances,
  } = useBalances(isConnected ? wallet?.smartWallet : null);

  const handleAirdrop = async () => {
    if (!wallet) return;

    setAirdropping(true);
    try {
      const connection = getConnection();
      const publicKey = new PublicKey(wallet.smartWallet);

      const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);

      alert('✅ Airdrop successful! You received 1 SOL');
      await fetchBalances();
    } catch (err: unknown) {
      console.error('Airdrop error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(
        '❌ Airdrop failed!\n\n' +
        'Devnet faucets have rate limits. If this continues to fail, try:\n\n' +
        'https://faucet.solana.com (SOL)\n' +
        'https://faucet.circle.com (USDC)\n\n' +
        `Error: ${message}`
      );
    } finally {
      setAirdropping(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgPage} overflow-x-hidden`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
          >
            ← Back to Home
          </Link>
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl">👛</span>
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl md:text-4xl font-bold ${theme.textPrimary} break-words`}>
                Recipe 01: Passkey Wallet Basics
              </h1>
            </div>
          </div>
          <p className={`${theme.textMuted} text-sm md:text-base`}>
            Learn how to create wallets with Face ID, check balances, and interact with Solana
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel - Explanation */}
          <div className="space-y-6 w-full min-w-0">
            <div className={`${theme.bgCard} rounded-2xl p-4 md:p-6`}>
              <h2 className={`text-xl md:text-2xl font-bold ${theme.textPrimary} mb-4`}>What You'll Learn</h2>
              <ul className={`space-y-3 text-sm md:text-base ${theme.textSecondary}`}>
                {[
                  'Create a Solana wallet using passkey authentication (Face ID/Touch ID)',
                  'Connect and disconnect from your wallet',
                  'Check your SOL and USDC balances',
                  'Request devnet SOL airdrops for testing',
                  'View your wallet address and explore on Solana Explorer'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${theme.bgCard} rounded-2xl p-4 md:p-6`}>
              <h2 className={`text-xl md:text-2xl font-bold ${theme.textPrimary} mb-4`}>How It Works</h2>
              <div className={`space-y-4 text-sm md:text-base ${theme.textSecondary}`}>
                {[
                  { title: '1. Passkey Authentication', desc: 'Instead of seed phrases, LazorKit uses WebAuthn (Face ID/Touch ID) to secure your wallet. Your private keys are stored securely and never leave your device.' },
                  { title: '2. Smart Wallet', desc: 'When you create a wallet, LazorKit generates a smart wallet address on Solana. This is a regular Solana address that can receive tokens and interact with programs.' },
                  { title: '3. No Extensions Needed', desc: "Unlike traditional wallets, you don't need to install any browser extensions. Everything works directly in your browser or mobile app." }
                ].map((item, i) => (
                  <div key={i}>
                    <h3 className={`text-base md:text-lg font-semibold ${theme.textPrimary} mb-2`}>{item.title}</h3>
                    <p className="text-sm break-words">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${theme.statusSuccess} rounded-2xl p-4 md:p-6`}>
              <h3 className="text-base md:text-lg font-semibold mb-2">💡 Pro Tip</h3>
              <p className="text-sm break-words">
                This demo uses Solana Devnet (test network). Devnet SOL has no real value and is only for testing.
                In production, you'd connect to Mainnet for real transactions.
              </p>
            </div>

            {/* Code Example */}
            <div className={`${theme.bgCard} rounded-2xl p-4 md:p-6 overflow-hidden`}>
              <h2 className={`text-xl md:text-2xl font-bold ${theme.textPrimary} mb-4`}>Code Example</h2>
              <div className={`${theme.codeBlock} rounded-lg p-3 md:p-4 overflow-x-auto`}>
                <pre className="text-xs md:text-sm">
                  <code>{`import { useWallet } from '@lazorkit/wallet';

function MyComponent() {
  const { wallet, connect } = useWallet();
  
  return (
    <button onClick={connect}>
      {wallet ? wallet.smartWallet : 'Connect'}
    </button>
  );
}`}</code>
                </pre>
              </div>
              <p className={`text-xs md:text-sm ${theme.textMuted} mt-3 break-words`}>
                That's it! Just one hook to access the entire wallet functionality.
              </p>
            </div>
          </div>

          {/* Right Panel - Interactive Demo */}
          <div className="space-y-6 w-full min-w-0">
            <div className={`${theme.bgCard} rounded-2xl p-6 md:p-8 lg:sticky lg:top-8`}>
              <h2 className={`text-xl md:text-2xl font-bold ${theme.textPrimary} mb-6`}>Try It Yourself</h2>

              {!isConnected ? (
                <div className="text-center py-8 md:py-12">
                  <div className="text-5xl md:text-6xl mb-6">🔐</div>
                  <h3 className={`text-lg md:text-xl font-semibold ${theme.textPrimary} mb-4`}>
                    Create Your Wallet
                  </h3>
                  <p className={`text-sm md:text-base ${theme.textMuted} mb-6 break-words`}>
                    Click the button below to create a wallet using Face ID or Touch ID
                  </p>
                  <button
                    onClick={connect}
                    disabled={connecting}
                    className={`w-full md:w-auto ${theme.btnPrimary} text-sm md:text-base`}
                  >
                    {connecting ? 'Creating Wallet...' : '🔑 Create Wallet with Passkey'}
                  </button>

                  <div className={`mt-6 p-3 ${theme.statusWarning} rounded-lg`}>
                    <p className="text-xs break-words">
                      If popup is blocked, you need to allow popups for LazorKit connection portal to come up.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Wallet Info */}
                  <div className={`${theme.statusSuccess} rounded-xl p-4 overflow-hidden`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                      <span className="text-green-500 font-semibold">Connected</span>
                    </div>
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <div className={`text-sm ${theme.textMuted} mb-1`}>Wallet Address</div>
                        <div className="flex items-center gap-2">
                          <code className={`text-xs font-mono ${theme.textPrimary} ${theme.bgInput} px-2 py-2 rounded flex-1 overflow-x-auto break-all`}>
                            {wallet?.smartWallet}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(wallet?.smartWallet || '');
                              alert('Address copied!');
                            }}
                            className={`px-3 py-2 ${theme.bgInput} hover:opacity-80 rounded text-sm flex-shrink-0`}
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      {/* Balances */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className={`text-xs ${theme.textMuted} mb-1`}>SOL Balance</div>
                          <div className={`text-xl md:text-2xl font-bold ${theme.textPrimary}`}>
                            {solBalance !== null ? `${solBalance.toFixed(4)}` : '...'}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs ${theme.textMuted} mb-1`}>USDC Balance</div>
                          <div className={`text-xl md:text-2xl font-bold ${theme.textPrimary}`}>
                            {usdcBalance !== null ? `${usdcBalance.toFixed(2)}` : '...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAirdrop}
                      disabled={airdropping}
                      className={`w-full px-4 md:px-6 py-3 ${theme.isLazorkit ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300'} rounded-lg font-semibold transition-all disabled:opacity-50 text-sm md:text-base`}
                    >
                      {airdropping ? '⏳ Requesting...' : '💧 Request 1 SOL Airdrop'}
                    </button>

                    <a href="https://faucet.circle.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full px-4 md:px-6 py-3 ${theme.isLazorkit ? 'bg-green-50 hover:bg-green-100 border border-green-200 text-green-700' : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300'} rounded-lg font-semibold transition-all text-center text-sm md:text-base`}
                    >
                      💵 Request USDC (Circle Faucet) ↗
                    </a>

                    {/* Faucet Links */}
                    <div className={`${theme.statusWarning} rounded-lg p-3`}>
                      <div className="text-xs text-center">
                        Having issues? Try the faucets directly:
                        <a href="https://faucet.solana.com/" target="_blank" className={`${theme.textAccent} hover:opacity-80 ml-1`}>SOL</a>
                        {' / '}
                        <a href="https://faucet.circle.com/" target="_blank" className={`${theme.textAccent} hover:opacity-80`}>USDC</a>
                      </div>
                    </div>

                    <button
                      onClick={fetchBalances}
                      disabled={refreshing}
                      className={`w-full px-4 md:px-6 py-3 ${theme.isLazorkit ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700' : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300'} rounded-lg font-semibold transition-all text-sm md:text-base disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                      {refreshing ? 'Refreshing...' : 'Refresh Balances'}
                    </button>

                    <a href={`https://explorer.solana.com/address/${wallet?.smartWallet}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full px-4 md:px-6 py-3 ${theme.btnSecondary} text-center text-sm md:text-base`}
                    >
                      🔍 View on Explorer ↗
                    </a>

                    <button
                      onClick={disconnect}
                      className={`w-full px-4 md:px-6 py-3 ${theme.btnDanger} text-sm md:text-base`}
                    >
                      🔌 Disconnect
                    </button>
                  </div>

                  {/* Info */}
                  <div className={`${theme.statusWarning} rounded-lg p-4`}>
                    <p className="text-xs md:text-sm break-words">
                      💡 Your wallet is secured by your device's biometrics.
                      No seed phrase needed - just your Face ID or Touch ID!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps */}
            {isConnected && (
              <div className={`${theme.bgCta} rounded-2xl p-4 md:p-6`}>
                <h3 className={`text-lg md:text-xl font-bold ${theme.textPrimary} mb-3`}>🎉 Great Job!</h3>
                <p className={`text-sm md:text-base ${theme.textSecondary} mb-4 break-words`}>
                  You've successfully created a wallet with passkeys! Ready for the next step?
                </p>
                <Link
                  href="/examples/02-gasless-transfer"
                  className={`inline-block w-full md:w-auto ${theme.btnPrimary} text-center text-sm md:text-base`}
                >
                  Next: Recipe 02 - Gasless Transfers →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
