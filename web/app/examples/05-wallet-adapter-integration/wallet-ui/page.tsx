'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from "next/image";
import {
  createSolanaDevnet,
  createWalletUiConfig,
  WalletUi,
  WalletUiDropdown,
  useWalletUi,
  useWalletUiSigner,
} from '@wallet-ui/react';
import {
  address,
  createSolanaClient,
  createTransaction,
} from 'gill';
import {
  getTransferTokensInstructions,
  getAssociatedTokenAccountAddress,
  TOKEN_PROGRAM_ADDRESS,
} from 'gill/programs/token';
import { getSignatureFromBytes, signAndSendTransactionMessageWithSigners } from 'gill';
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';
import {
  USDC_MINT,
  withRetry,
  formatTransactionError,
  validateTransferAmount,
  createTransferSuccessMessage,
} from '@/lib/solana-utils';

const USDC_DECIMALS = 6;

const config = createWalletUiConfig({
  clusters: [createSolanaDevnet()],
});

// Signer hook requires an account, so we split this out
function TransferDemoWithSigner({ account }: { account: NonNullable<ReturnType<typeof useWalletUi>['account']> }) {
  const signer = useWalletUiSigner({ account });
  const { usdcBalance, loading: balanceLoading, fetchBalances } = useBalances(account.address);
  const {
    recipient, setRecipient,
    amount, setAmount,
    sending,
    retryCount, setRetryCount,
    lastTxSignature, setLastTxSignature,
    resetForm, startSending, stopSending,
  } = useTransferForm();

  const solanaClient = useMemo(() => {
    return createSolanaClient({ urlOrMoniker: 'devnet' });
  }, []);

  const handleSend = async () => {
    if (!signer || !recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    // Wallet-UI uses gill's address() for validation
    let recipientAddress;
    try {
      recipientAddress = address(recipient);
    } catch {
      alert('Invalid recipient address');
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
          const mint = address(USDC_MINT.toBase58());
          const authority = address(account.address);

          // Get ATA addresses
          const sourceAta = await getAssociatedTokenAccountAddress(mint, authority, TOKEN_PROGRAM_ADDRESS);
          const destinationAta = await getAssociatedTokenAccountAddress(mint, recipientAddress, TOKEN_PROGRAM_ADDRESS);

          // Convert to raw amount (6 decimals for USDC)
          const rawAmount = BigInt(Math.floor(amountValidation.amountNum! * Math.pow(10, USDC_DECIMALS)));

          // Build transfer instructions
          const instructions = getTransferTokensInstructions({
            feePayer: signer,
            mint,
            authority: signer,
            sourceAta,
            destination: recipientAddress,
            destinationAta,
            amount: rawAmount,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          });

          // Fresh blockhash for each attempt
          const { value: latestBlockhash } = await solanaClient.rpc.getLatestBlockhash().send();

          const transaction = createTransaction({
            version: 'legacy',
            feePayer: signer,
            instructions,
            latestBlockhash,
          });

          console.log('Sending transaction via wallet-ui + gill...');
          const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction);
          const sig = getSignatureFromBytes(signatureBytes);
          console.log('Transaction signature:', sig);

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

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div>
            <p className="text-sm text-gray-400">Connected Wallet</p>
            <p className="text-white font-mono text-sm">
              {account.address.slice(0, 8)}...{account.address.slice(-8)}
            </p>
          </div>
          <div className="relative z-100">
            <WalletUiDropdown />
          </div>
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
    </div>
  );
}

function TransferDemo() {
  const { account } = useWalletUi();

  if (!account) {
    return (
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Try Gasless Transfer</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-6">💸</div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Click the button below to select a wallet. LazorKit will appear alongside other installed wallets.
          </p>
          <div className="flex justify-center relative z-100">
            <WalletUiDropdown />
          </div>
        </div>
      </div>
    );
  }

  return <TransferDemoWithSigner account={account} />;
}

export default function WalletUIAdapterPage() {
  return (
    <WalletUi config={config}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Link
              href="/examples/05-wallet-adapter-integration"
              className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
            >
              &larr; Back to Wallet Adapters
            </Link>
            <div className="flex items-center gap-3 mb-2">
                <Image
                    src='/icons/walletui.png'
                    alt='Wallet-UI'
                    width={32}
                    height={32}
                    className="rounded-md"
                />
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
                  Wallet-UI Adapter
                </h1>
              </div>
            </div>
            <p className="text-gray-400 text-sm md:text-base">
              Modern wallet UI with gill transaction building
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
{`npm install @wallet-ui/react gill \\
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
import {
  createSolanaDevnet,
  createWalletUiConfig,
  WalletUi,
} from '@wallet-ui/react';
import { registerLazorkitWallet } from '@lazorkit/wallet';

const config = createWalletUiConfig({
  clusters: [createSolanaDevnet()],
});

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

  return (
    <WalletUi config={config}>
      {children}
    </WalletUi>
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
{`import {
  useWalletUi,
  useWalletUiSigner,
  WalletUiDropdown
} from '@wallet-ui/react';
import {
  address,
  createSolanaClient,
  createTransaction
} from 'gill';
import {
  getTransferTokensInstructions,
  getAssociatedTokenAccountAddress,
} from 'gill/programs/token';

function MyComponent() {
  const { account } = useWalletUi();
  const signer = useWalletUiSigner({ account });
  const client = createSolanaClient({ urlOrMoniker: 'devnet' });

  const handleSend = async () => {
    const instructions = getTransferTokensInstructions({
      feePayer: signer,
      mint: address('...'),
      authority: signer,
      sourceAta: await getAssociatedTokenAccountAddress(...),
      destination: address('...'),
      destinationAta: await getAssociatedTokenAccountAddress(...),
      amount: 1000000n, // 1 USDC (6 decimals)
    });

    const { value: latestBlockhash } = await client.rpc
      .getLatestBlockhash().send();

    const tx = createTransaction({
      version: 'legacy',
      feePayer: signer,
      instructions,
      latestBlockhash,
    });

    const sig = await client.sendAndConfirmTransaction(tx);
  };

  return (
    <div>
      <WalletUiDropdown />
      {account && (
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
                    <span><strong>Gill Integration:</strong> Modern transaction building with Solana Kit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>useWalletUiSigner:</strong> Returns a TransactionSendingSigner for signing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Wallet-Standard:</strong> LazorKit auto-discovered after registration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Gasless for LazorKit:</strong> Paymaster auto-handles gas when using LazorKit</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Panel - Demo */}
            <div className="space-y-6 w-full min-w-0 lg:sticky lg:top-8 lg:self-start">
                <div className="relative z-100">
                    <TransferDemo />
                </div>

              {/* Links */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                <div className="space-y-2">
                  <a
                    href="https://wallet-ui.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>📚</span> Wallet-UI Documentation
                  </a>
                  <a
                    href="https://github.com/wallet-ui/wallet-ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>💻</span> Wallet-UI GitHub
                  </a>
                  <a
                    href="https://github.com/solana-developers/gill"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <span>🐟</span> Gill Documentation
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
    </WalletUi>
  );
}
