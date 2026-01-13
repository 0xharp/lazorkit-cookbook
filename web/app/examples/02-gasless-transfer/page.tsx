'use client';

import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useBalances } from '@/hooks/useBalances';
import { useTransferForm } from '@/hooks/useTransferForm';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import {
  getConnection,
  formatTransactionError,
  buildUsdcTransferInstructions,
  withRetry,
  validateRecipientAddress,
  validateTransferAmount,
  createTransferSuccessMessage,
} from '@/lib/solana-utils';

export default function Recipe02Page() {
  const { wallet, isConnected, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
  const theme = useThemeClasses();
  const {
    recipient, setRecipient,
    amount, setAmount,
    sending,
    retryCount, setRetryCount,
    lastTxSignature, setLastTxSignature,
    resetForm, startSending, stopSending,
  } = useTransferForm();

  const {
    usdcBalance,
    loading: refreshing,
    fetchBalances: fetchBalance,
  } = useBalances(isConnected ? wallet?.smartWallet : null);

  const handleSend = async () => {
    if (!wallet || !recipient || !amount) {
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
          const senderPubkey = new PublicKey(wallet.smartWallet);

          const instructions = await buildUsdcTransferInstructions(
            connection,
            senderPubkey,
            recipientValidation.address!,
            amountValidation.amountNum!
          );

          console.log('Sending gasless transaction...');
          const sig = await signAndSendTransaction({
            instructions,
            transactionOptions: { computeUnitLimit: 200_000 }
          });

          console.log('Transaction signature:', sig);

          await connection.confirmTransaction(sig, 'confirmed');

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
      alert(createTransferSuccessMessage(amountValidation.amountNum!, recipient, { gasless: true }));
      resetForm();
      await fetchBalance();
    } catch (err: unknown) {
      console.error('Transfer error:', err);
      alert(formatTransactionError(err, 'Transfer'));
    } finally {
      stopSending();
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgPage} overflow-x-hidden`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link href="/" className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl">⚡</span>
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl md:text-4xl font-bold ${theme.textPrimary} break-words`}>
                Recipe 02: Gasless USDC Transfer
              </h1>
            </div>
          </div>
          <p className={`${theme.textMuted} text-sm md:text-base`}>
            Send USDC without paying gas fees using LazorKit's paymaster
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel */}
          <div className="space-y-6 w-full min-w-0">
            {/* The Game Changer Section */}
            <div className={`${theme.statusSuccess} rounded-2xl p-6`}>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                <span>🎯</span> The Game Changer: Gasless Transactions
              </h2>

              <div className={`space-y-4 text-sm ${theme.textSecondary}`}>
                <div className={`${theme.statusError} rounded-lg p-4`}>
                  <p className="font-semibold mb-2">Traditional Solana apps require users to:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Buy SOL on an exchange</li>
                    <li>Transfer SOL to their wallet</li>
                    <li>Keep enough SOL for gas fees</li>
                    <li>Hope they don't run out mid-transaction</li>
                  </ol>
                  <p className="mt-3 font-semibold">
                    ⚠️ This creates significant onboarding friction. Many users drop off here.
                  </p>
                </div>

                <div className={`${theme.statusSuccess} rounded-lg p-4`}>
                  <p className="font-semibold mb-2">With LazorKit's Paymaster:</p>
                  <div className={`${theme.codeBlock} rounded p-3 mb-3`}>
                    <code className="text-xs">
                      {`// User only needs USDC
// LazorKit pays the gas
const signature = await signAndSendTransaction({
  instructions: [transferIx],
});
// ✨ Transaction complete - user paid $0 in gas`}
                    </code>
                  </div>
                  <ul className="space-y-2">
                    {['Users never touch SOL', 'Can use stablecoins immediately', 'Perfect for payments, commerce, tipping', 'Significantly reduced onboarding friction'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${theme.bgCardAlt} rounded-lg p-4`}>
                  <p className="font-semibold mb-2">Under the Hood:</p>
                  <p className="text-xs leading-relaxed">
                    LazorKit's paymaster service detects your transaction needs gas, adds their signature to cover the fee, submits the transaction atomically, and the user only signs once while paying nothing.
                  </p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className={`${theme.bgCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>What You'll Learn</h2>
              <ul className={`space-y-3 text-sm ${theme.textSecondary}`}>
                {[
                  'Send USDC tokens without paying SOL for gas',
                  "How LazorKit's paymaster covers transaction fees",
                  'Create token accounts automatically if needed',
                  'Build and sign SPL token transfer instructions',
                  "True Web2-like UX - users never worry about gas"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code Example */}
            <div className={`${theme.bgCard} rounded-2xl p-6 overflow-hidden`}>
              <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Code Example</h2>
              <div className={`${theme.codeBlock} rounded-lg p-4 overflow-x-auto`}>
                <pre className="text-xs">
                  <code>{`const { signAndSendTransaction } = useWallet();

// Build transfer instruction
const transferIx = createTransferInstruction(
  senderTokenAccount,
  recipientTokenAccount,
  senderPubkey,
  amount * 1_000_000, // USDC has 6 decimals
);

// Send gasless transaction
const signature = await signAndSendTransaction({
  instructions: [transferIx],
});

// No SOL needed! Paymaster covers the fee ✨`}</code>
                </pre>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-3`}>
                LazorKit handles all the complexity. Just build your instructions and send!
              </p>
            </div>
          </div>

          {/* Right Panel - Interactive Demo */}
          <div className="space-y-6 w-full min-w-0">
            <div className={`${theme.bgCard} rounded-2xl p-6 lg:sticky lg:top-8`}>
              <h2 className={`text-xl font-bold ${theme.textPrimary} mb-6`}>Try It Yourself</h2>

              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">💸</div>
                  <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>
                    Connect Your Wallet
                  </h3>
                  <p className={`text-sm ${theme.textMuted} mb-6`}>
                    Connect with Face ID to start sending gasless USDC transfers
                  </p>
                  <button
                    onClick={connect}
                    disabled={connecting}
                    className={`w-full ${theme.btnPrimary}`}
                  >
                    {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className={`${theme.statusSuccess} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${theme.textMuted}`}>Your USDC Balance</span>
                      <button
                        onClick={fetchBalance}
                        disabled={refreshing}
                        className={`text-xs ${theme.textAccent} hover:opacity-80 disabled:opacity-50 flex items-center gap-1`}
                      >
                        <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <div className={`text-3xl font-bold ${theme.textPrimary}`}>
                      {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Loading...'}
                    </div>
                    {usdcBalance === 0 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ No USDC? Get some from{' '}
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
                        className={`w-full px-4 py-3 ${theme.bgInput} rounded-lg ${theme.textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono`}
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
                        className={`w-full px-4 py-3 ${theme.bgInput} rounded-lg ${theme.textPrimary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
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
                        : 'Send USDC (Gasless!)'}
                    </button>
                  </div>

                  {/* Gasless Info */}
                  <div className={`${theme.statusWarning} rounded-lg p-4`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">✨</span>
                      <div>
                        <p className="text-sm font-semibold mb-1">100% Gasless</p>
                        <p className="text-xs">
                          LazorKit's paymaster covers all transaction fees. You don't need any SOL!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Transaction */}
                  {lastTxSignature && (
                    <div className={`${theme.bgInput} rounded-lg p-4`}>
                      <p className={`text-xs ${theme.textMuted} mb-2`}>Last Transaction:</p>
                      <a href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
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

            {/* Next Steps */}
            {isConnected && (
              <div className={`${theme.bgCta} rounded-2xl p-6`}>
                <h3 className={`text-xl font-bold ${theme.textPrimary} mb-3`}>🎉 Awesome!</h3>
                <p className={`text-sm ${theme.textSecondary} mb-4`}>
                  You've mastered gasless transactions! Ready for the advanced recipe?
                </p>
                <Link
                  href="/examples/03-subscription-service"
                  className={`inline-block w-full ${theme.btnPrimary} text-center text-sm`}
                >
                  Next: Recipe 03 - Subscription Service →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
