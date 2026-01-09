'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
    useConnector,
    useAccount,
    AppProvider,
} from '@solana/connector/react';
import { useTransactionSigner } from '@solana/connector';
import { getDefaultConfig, getDefaultMobileConfig } from '@solana/connector/headless';
import { ConnectButton } from '@/components/connector/radix-ui';
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';
import {
    getConnection,
    buildUsdcTransferInstructions,
    formatTransactionError,
    withRetry,
    RPC_URL,
    validateRecipientAddress,
    validateTransferAmount,
    createTransferSuccessMessage,
} from '@/lib/solana-utils';

function TransferForm() {
    const { address: accountAddress } = useAccount();
    const { signer, ready } = useTransactionSigner();
    const { usdcBalance, loading: refreshing, fetchBalances } = useBalances(accountAddress);
    const {
        recipient, setRecipient,
        amount, setAmount,
        sending, setSending,
        retryCount, setRetryCount,
        lastTxSignature, setLastTxSignature,
        resetForm, startSending, stopSending,
    } = useTransferForm();

    const handleSend = async () => {
        if (!accountAddress || !signer || !ready || !recipient || !amount) {
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
                    const connection = getConnection();
                    const publicKey = new PublicKey(accountAddress);

                    const instructions = await buildUsdcTransferInstructions(
                        connection,
                        publicKey,
                        recipientValidation.address!,
                        amountValidation.amountNum!
                    );

                    // Get fresh blockhash
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
                    const transaction = new Transaction({
                        feePayer: publicKey,
                        blockhash,
                        lastValidBlockHeight,
                    });
                    transaction.add(...instructions);

                    const sigResult = await signer?.signAndSendTransaction(transaction);
                    console.log('Transaction signature:', sigResult);

                    const signature =
                        typeof sigResult === 'string'
                            ? sigResult
                            : undefined;

                    if (!signature) {
                        throw new Error('No signature returned');
                    }

                    return signature;
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

    if (!accountAddress) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Balance Display */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Your USDC Balance</span>
                    <button
                        onClick={fetchBalances}
                        disabled={refreshing}
                        className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1"
                    >
                        <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
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
                    disabled={sending || !signer || !recipient || !amount || usdcBalance === 0}
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
    );
}

// Main demo component using pre-built ConnectButton
function ConnectorKitDemo() {
    const { connected } = useConnector();
    const { address: accountAddress, formatted } = useAccount();

    if (connected && accountAddress) {
        return (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Try Gasless Transfer</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div>
                            <p className="text-sm text-gray-400">Connected Wallet</p>
                            <p className="text-white font-mono text-sm">{formatted}</p>
                        </div>
                        <ConnectButton />
                    </div>
                    <TransferForm />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Try Gasless Transfer</h2>
            <div className="text-center py-8">
                <div className="text-6xl mb-6">💸</div>
                <h3 className="text-xl font-semibold text-white mb-4">
                    Connect Your Wallet
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                    Click the button below to open the wallet modal. LazorKit appears automatically via wallet-standard.
                </p>
                <div className="flex justify-center">
                    <ConnectButton />
                </div>
            </div>
        </div>
    );
}

// Provider wrapper with proper config
function ConnectorKitProvider({ children }: { children: React.ReactNode }) {

    const config = useMemo(() => {
        const clusters = RPC_URL
            ? [
                {
                    id: 'solana:devnet' as const,
                    label: 'Devnet',
                    name: 'devnet' as const,
                    url: RPC_URL,
                },
            ]
            : undefined;

        return getDefaultConfig({
            appName: 'LazorKit Cookbook',
            appUrl: 'https://lazorkit-cookbook.vercel.app',
            autoConnect: true,
            enableMobile: true,
            clusters
        })
    }, []);

    const mobile = useMemo(
        () =>
            getDefaultMobileConfig({
                appName: 'LazorKit Cookbook',
                appUrl: 'https://lazorkit-cookbook.vercel.app',
            }),
        [],
    );

    return (
        <AppProvider connectorConfig={config} mobile={mobile}>
            {children}
        </AppProvider>
    );
}

export default function ConnectorKitPage() {
    return (
        <ConnectorKitProvider>
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
                                src="/icons/connectorkit.png"
                                alt="ConnectorKit"
                                width={32}
                                height={32}
                                className="rounded-md"
                            />
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
                                    ConnectorKit Integration
                                </h1>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm md:text-base">
                            Solana Foundation's modern wallet connector with pre-built UI components
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
{`npm install @solana/connector @lazorkit/wallet

# For pre-built UI components (shadcn/ui)
npx shadcn@latest add button dialog \\
  dropdown-menu avatar badge`}
                  </pre>
                                </div>
                            </div>

                            {/* Provider Setup */}
                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Provider Setup</h2>
                                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
{`import { useEffect } from 'react';
import { AppProvider } from '@solana/connector/react';
import { getDefaultConfig } from '@solana/connector/headless';
import { registerLazorkitWallet } from '@lazorkit/wallet';

function App() {
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

  const config = getDefaultConfig({
    appName: 'My App',
    network: 'devnet',
  });

  return (
    <AppProvider connectorConfig={config}>
      <YourApp />
    </AppProvider>
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
  useConnector,
} from '@solana/connector/react';
import { useTransactionSigner } from '@solana/connector';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

function MyComponent() {
  const { signer } = useTransactionSigner();
  const { disconnect } = useConnector();

  const handleSend = async () => {
    const connection = new Connection('https://api.devnet.solana.com');
    const publicKey = new PublicKey(walletAdapter.publicKey);

    // Build transaction with web3.js
    const { blockhash, lastValidBlockHeight } = await connection
      .getLatestBlockhash('finalized');

    const transaction = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    });
    transaction.add(...instructions);

    // Send via useTransactionSigner (for Solana Web3.js)
    const signature = await signer.signAndSendTransaction(transaction);
  };

  return (
    <div>
      <ConnectButton />
      {(
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
                                        <span><strong>Pre-built Components:</strong> ConnectButton, WalletModal with shadcn/ui styling</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-400 mt-1">✓</span>
                                        <span><strong>useTransactionSigner:</strong> For legacy web3.js compatibility</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-green-400 mt-1">✓</span>
                                        <span><strong>Wallet Standard:</strong> LazorKit auto-discovered after registration</span>
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
                            <ConnectorKitDemo />

                            {/* Links */}
                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                                <div className="space-y-2">
                                    <a
                                        href="https://www.connectorkit.dev"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                                    >
                                        <span>📚</span> ConnectorKit Documentation
                                    </a>
                                    <a
                                        href="https://github.com/solana-foundation/connectorkit"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                                    >
                                        <span>💻</span> ConnectorKit GitHub
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
        </ConnectorKitProvider>
    );
}
