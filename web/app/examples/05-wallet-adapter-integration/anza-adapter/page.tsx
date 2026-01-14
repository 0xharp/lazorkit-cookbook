'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { PublicKey, Transaction } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';
import {
  getConnection,
  buildUsdcTransferInstructions,
  formatTransactionError,
  withRetry,
  validateRecipientAddress,
  validateTransferAmount,
  createTransferSuccessMessage,
} from '@/lib/solana-utils';

import '@solana/wallet-adapter-react-ui/styles.css';

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

          console.log('Sending transaction via wallet adapter...');
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

  const theme = useThemeClasses();

  return (
    <div className={`${theme.bgCard} rounded-2xl p-6`}>
      <h2 className={`text-xl font-bold ${theme.textPrimary} mb-6`}>Try Gasless Transfer</h2>

      {!connected ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">💸</div>
          <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>
            Connect Your Wallet
          </h3>
          <p className={`text-sm ${theme.textMuted} mb-6`}>
            Click the button below to open the wallet modal. LazorKit will appear alongside other installed wallets.
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600 !rounded-xl !font-semibold !h-12 !px-8" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 ${theme.statusSuccess} rounded-xl`}>
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Connected Wallet</p>
              <p className={`${theme.textPrimary} font-mono text-sm`}>
                {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
              </p>
            </div>
            <WalletDisconnectButton className="!bg-red-500/20 !border !border-red-500/30 hover:!bg-red-500/30 !rounded-lg !h-10" />
          </div>

          {/* Balance Display */}
          <div className={`${theme.statusSuccess} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${theme.textMuted}`}>Your USDC Balance</span>
              <button
                onClick={fetchBalances}
                disabled={balanceLoading}
                className={`text-xs ${theme.textAccent} hover:opacity-80 disabled:opacity-50 flex items-center gap-1`}
              >
                <span className={balanceLoading ? 'animate-spin' : ''}>🔄</span>
                {balanceLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className={`text-3xl font-bold ${theme.textPrimary}`}>
              {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Loading...'}
            </div>
            {usdcBalance === 0 && (
              <p className={`text-xs ${theme.infoYellowTitle} mt-2`}>
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
              <label className={`block text-sm ${theme.textMuted} mb-2`}>
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address..."
                className={`w-full px-4 py-3 ${theme.bgInput} rounded-lg ${theme.textPrimary} placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm font-mono`}
              />
            </div>

            <div>
              <label className={`block text-sm ${theme.textMuted} mb-2`}>
                Amount (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 ${theme.bgInput} rounded-lg ${theme.textPrimary} placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm`}
              />
              {usdcBalance !== null && usdcBalance > 0 && (
                <button
                  onClick={() => setAmount(usdcBalance.toString())}
                  className={`text-xs ${theme.textAccent} hover:opacity-80 mt-1`}
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
          <div className={`${theme.infoBlue} rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className={`text-sm ${theme.infoBlueTitle} font-semibold mb-1`}>
                  Gasless with LazorKit
                </p>
                <p className={`text-xs ${theme.infoBlueText}`}>
                  When connected via LazorKit (passkey), the paymaster covers transaction fees.
                  Other wallets will pay standard SOL fees.
                </p>
              </div>
            </div>
          </div>

          {/* Last Transaction */}
          {lastTxSignature && (
            <div className={`${theme.bgCard} rounded-lg p-4`}>
              <p className={`text-xs ${theme.textMuted} mb-2`}>Last Transaction:</p>
              <a
                href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs ${theme.textAccent} hover:opacity-80 break-all`}
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

// LazorKit is registered in the parent layout
function AnzaAdapterProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default function AnzaAdapterPage() {
  const theme = useThemeClasses();
  return (
    <AnzaAdapterProvider>
      <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Link
              href="/examples/05-wallet-adapter-integration"
              className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
            >
              &larr; Back to Wallet Adapters
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Image
                src='/icons/anza.png'
                alt='Anza'
                width={32}
                height={32}
                className="rounded-md"
              />
              <div className="flex-1 min-w-0">
                <h1 className={`text-3xl md:text-4xl font-bold ${theme.textPrimary} break-words`}>
                  Anza Wallet Adapter
                </h1>
              </div>
            </div>
            <p className={`${theme.textMuted} text-sm md:text-base`}>
              The official Solana wallet adapter with built-in modal UI
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Panel - Code Example */}
            <div className="space-y-6 w-full min-w-0">
              {/* Installation */}
              <div className={`${theme.bgCard} rounded-2xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Installation</h2>
                <div className={`${theme.codeBlock} rounded-lg p-4 overflow-x-auto`}>
                  <pre className="text-xs text-gray-100">
                    {`npm install @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui \\
  @lazorkit/wallet`}
                  </pre>
                </div>
              </div>

              {/* Provider Setup */}
              <div className={`${theme.bgCard} rounded-2xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Provider Setup</h2>
                <div className={`${theme.codeBlock} rounded-lg p-4 overflow-x-auto`}>
                  <pre className="text-xs text-gray-100">
                    {`import { useEffect, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { registerLazorkitWallet } from '@lazorkit/wallet';

// Import the modal styles
import '@solana/wallet-adapter-react-ui/styles.css';

function AppProvider({ children }) {
  // Register LazorKit on mount
  useEffect(() => {
    registerLazorkitWallet({
      rpcUrl: 'https://api.devnet.solana.com',
      portalUrl: 'https://portal.lazor.sh',
      paymasterConfig: {
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
      },
      clusterSimulation: 'devnet',
    });
  }, []);

  // Empty array - wallet-standard handles discovery
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}`}
                  </pre>
                </div>
              </div>

              {/* Using the Hooks */}
              <div className={`${theme.bgCard} rounded-2xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Using the Hooks</h2>
                <div className={`${theme.codeBlock} rounded-lg p-4 overflow-x-auto`}>
                  <pre className="text-xs text-gray-100">
                    {`import { useWallet, useConnection } from
  '@solana/wallet-adapter-react';
import { WalletMultiButton } from
  '@solana/wallet-adapter-react-ui';

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
      {/* This button opens a modal with all wallets */}
      <WalletMultiButton />

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
              <div className={`${theme.infoBlue} rounded-2xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Key Points</h2>
                <ul className={`space-y-3 text-sm ${theme.textSecondary}`}>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span><strong>Automatic Discovery:</strong> LazorKit appears in the modal after registration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span><strong>Empty Wallets Array:</strong> No need to import wallet adapters manually</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span><strong>Same API:</strong> useWallet() works identically for all wallets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span><strong>Gasless for LazorKit:</strong> Paymaster auto-handles gas when using LazorKit</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Panel - Demo */}
            <div className="space-y-6 w-full min-w-0 lg:sticky lg:top-8 lg:self-start">
              <TransferDemo />

              {/* Links */}
              <div className={`${theme.bgCard} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Resources</h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/anza-xyz/wallet-adapter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm"
                  >
                    <span>📚</span> Anza Wallet Adapter Docs
                  </a>
                  <a
                    href="https://docs.lazorkit.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm"
                  >
                    <span>🔑</span> LazorKit Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnzaAdapterProvider>
  );
}
