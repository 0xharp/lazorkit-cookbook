'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PublicKey,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import Link from 'next/link';
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import BN from 'bn.js';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useBalances } from '@/hooks/useBalances';
import {
    getConnection,
    getAssociatedTokenAddressSync,
    formatTransactionError,
} from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

// Marinade addresses (same on devnet and mainnet)
const MSOL_MINT = new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');

export default function Recipe08() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const theme = useThemeClasses();

    // Tab state
    const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');

    // Stake state
    const [stakeAmount, setStakeAmount] = useState('');
    const [staking, setStaking] = useState(false);

    // Unstake state
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [unstaking, setUnstaking] = useState(false);
    const [unstakeQuote, setUnstakeQuote] = useState<{ solOutput: number; feeBp: number } | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    // mSOL balance
    const [msolBalance, setMsolBalance] = useState<number | null>(null);
    const [loadingMsol, setLoadingMsol] = useState(false);

    // Marinade state info
    const [msolPrice, setMsolPrice] = useState<number | null>(null);

    // Transaction state
    const [lastTxSignature, setLastTxSignature] = useState('');

    // Use existing balance hook for SOL
    const {
        solBalance,
        loading: refreshing,
        fetchBalances: fetchSolBalance,
    } = useBalances(isConnected ? wallet?.smartWallet : null);

    // Fetch mSOL balance
    const fetchMsolBalance = useCallback(async () => {
        if (!wallet?.smartWallet) return;

        setLoadingMsol(true);
        try {
            const connection = getConnection();
            const tokenAccount = getAssociatedTokenAddressSync(MSOL_MINT, new PublicKey(wallet.smartWallet));

            const accountInfo = await connection.getAccountInfo(tokenAccount);
            if (accountInfo) {
                // Parse token account data - balance is at offset 64, 8 bytes little-endian
                const data = accountInfo.data;
                const balance = data.readBigUInt64LE(64);
                setMsolBalance(Number(balance) / LAMPORTS_PER_SOL);
            } else {
                setMsolBalance(0);
            }
        } catch (err) {
            console.error('Error fetching mSOL balance:', err);
            setMsolBalance(0);
        } finally {
            setLoadingMsol(false);
        }
    }, [wallet?.smartWallet]);

    // Fetch Marinade state (mSOL price)
    const fetchMarinadeState = useCallback(async () => {
        try {
            const connection = getConnection();
            const config = new MarinadeConfig({ connection });
            const marinade = new Marinade(config);
            const state = await marinade.getMarinadeState();

            // mSOL price = total SOL staked / mSOL supply
            const msolPriceValue = state.mSolPrice;
            setMsolPrice(msolPriceValue);
        } catch (err) {
            console.error('Error fetching Marinade state:', err);
            // Default to 1:1 if we can't fetch
            setMsolPrice(1.0);
        }
    }, []);

    // Fetch unstake quote with actual fee from Marinade
    const fetchUnstakeQuote = useCallback(async (msolAmount: number) => {
        if (!msolAmount || msolAmount <= 0 || !msolPrice) {
            setUnstakeQuote(null);
            return;
        }

        setQuoteLoading(true);
        try {
            const connection = getConnection();
            const config = new MarinadeConfig({ connection });
            const marinade = new Marinade(config);
            const state = await marinade.getMarinadeState();

            // Calculate expected SOL output (before fee)
            const expectedSolLamports = Math.floor(msolAmount * msolPrice * LAMPORTS_PER_SOL);

            // Get the actual fee from Marinade state
            const feeBp = await state.unstakeNowFeeBp(new BN(expectedSolLamports));

            // Calculate final output after fee
            const feeMultiplier = 1 - (feeBp / 10000);
            const finalSolOutput = (msolAmount * msolPrice) * feeMultiplier;

            setUnstakeQuote({
                solOutput: finalSolOutput,
                feeBp: feeBp,
            });
        } catch (err) {
            console.error('Error fetching unstake quote:', err);
            // Fallback to simple calculation
            if (msolPrice) {
                setUnstakeQuote({
                    solOutput: msolAmount * msolPrice * 0.99, // Assume ~1% fee as fallback
                    feeBp: 100,
                });
            }
        } finally {
            setQuoteLoading(false);
        }
    }, [msolPrice]);

    // Debounced quote fetch when unstake amount changes
    useEffect(() => {
        const amount = parseFloat(unstakeAmount);
        if (isNaN(amount) || amount <= 0) {
            setUnstakeQuote(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchUnstakeQuote(amount);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [unstakeAmount, fetchUnstakeQuote]);

    // Fetch all data when wallet connects
    useEffect(() => {
        if (isConnected && wallet?.smartWallet) {
            fetchMsolBalance();
            fetchMarinadeState();
        }
    }, [isConnected, wallet?.smartWallet, fetchMsolBalance, fetchMarinadeState]);

    // Refresh all balances
    const refreshAll = async () => {
        await Promise.all([
            fetchSolBalance(),
            fetchMsolBalance(),
        ]);
    };

    // Calculate estimated mSOL for staking
    const estimatedMsol = stakeAmount && msolPrice
        ? (parseFloat(stakeAmount) / msolPrice).toFixed(6)
        : '0';

    // Handle Stake
    const handleStake = async () => {
        if (!wallet || !stakeAmount) {
            alert('Please enter an amount');
            return;
        }

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid amount');
            return;
        }

        if (amount > (solBalance || 0)) {
            alert(`Insufficient SOL balance. You have ${solBalance?.toFixed(4) || '0'} SOL.`);
            return;
        }

        setStaking(true);
        try {
            const connection = getConnection();
            const config = new MarinadeConfig({
                connection,
                publicKey: new PublicKey(wallet.smartWallet),
            });
            const marinade = new Marinade(config);

            const amountLamports = new BN(Math.floor(amount * LAMPORTS_PER_SOL));
            const { transaction } = await marinade.deposit(amountLamports);

            // Process instructions for LazorKit
            const instructions = processInstructionsForLazorKit(
                transaction.instructions,
                wallet.smartWallet
            );

            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000
                }
            });

            setLastTxSignature(signature);
            alert(
                `Staked ${amount} SOL for ~${estimatedMsol} mSOL!\n\n` +
                `No gas fees paid!`
            );

            setStakeAmount('');
            await refreshAll();

        } catch (err: any) {
            console.error('Stake error:', err);
            const errorMsg = formatTransactionError(err, 'Stake');
            alert(`Stake failed: ${errorMsg}`);
        } finally {
            setStaking(false);
        }
    };

    // Handle Instant Unstake
    const handleInstantUnstake = async () => {
        if (!wallet || !unstakeAmount) {
            alert('Please enter an amount');
            return;
        }

        const amount = parseFloat(unstakeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid amount');
            return;
        }

        if (amount > (msolBalance || 0)) {
            alert(`Insufficient mSOL balance. You have ${msolBalance?.toFixed(6) || '0'} mSOL.`);
            return;
        }

        setUnstaking(true);
        try {
            const connection = getConnection();
            const config = new MarinadeConfig({
                connection,
                publicKey: new PublicKey(wallet.smartWallet),
            });
            const marinade = new Marinade(config);

            const amountLamports = new BN(Math.floor(amount * LAMPORTS_PER_SOL));
            const { transaction } = await marinade.liquidUnstake(amountLamports);

            // Process instructions for LazorKit
            const instructions = processInstructionsForLazorKit(
                transaction.instructions,
                wallet.smartWallet
            );

            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000
                }
            });

            setLastTxSignature(signature);

            const expectedSol = unstakeQuote?.solOutput.toFixed(6) || 'unknown';
            const feePct = unstakeQuote ? (unstakeQuote.feeBp / 100).toFixed(2) : 'unknown';

            alert(
                `Unstaked ${amount} mSOL!\n\n` +
                `Expected: ~${expectedSol} SOL\n` +
                `Pool fee: ${feePct}%\n\n` +
                `No gas fees paid!`
            );

            setUnstakeAmount('');
            setUnstakeQuote(null);
            await refreshAll();

        } catch (err: any) {
            console.error('Instant unstake error:', err);

            let errorMessage = err.message || 'Unknown error';
            if (errorMessage.includes('insufficient') || errorMessage.includes('0x1')) {
                errorMessage = 'Insufficient liquidity in the pool. Try a smaller amount.';
            }

            alert(`Unstake failed: ${errorMessage}`);
        } finally {
            setUnstaking(false);
        }
    };

    return (
        <div className={`min-h-screen ${theme.bgPage}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                    >
                        &larr; Back to Home
                    </Link>
                    <div className="flex items-start gap-3 mb-2">
                        <span className="text-4xl">🥩</span>
                        <div>
                            <h1 className={`text-4xl font-bold ${theme.textPrimary}`}>
                                Gasless Liquid Staking with Marinade
                            </h1>
                        </div>
                    </div>
                    <p className={theme.textMuted}>
                        Stake SOL for mSOL with zero gas fees via LazorKit
                    </p>
                </div>

                {/* Devnet Warning */}
                <div className={`mb-6 ${theme.infoYellow} rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">&#9888;&#65039;</span>
                        <div>
                            <h3 className={`${theme.infoYellowTitle} font-semibold mb-2`}>
                                Devnet Notice
                            </h3>
                            <div className={`text-sm ${theme.infoYellowText} space-y-2`}>
                                <p>
                                    This demo runs on <strong>Solana Devnet</strong>. Liquidity pool depth may vary,
                                    affecting unstake fees.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Info */}
                    <div className="space-y-6">
                        {/* Integration Highlight */}
                        <div className={`${theme.infoBlue} rounded-2xl p-6`}>
                            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                <span>🤝</span> Marinade x LazorKit
                            </h2>
                            <p className={`text-sm ${theme.textSecondary} mb-4`}>
                                Liquid staking with LazorKit smart wallet integration.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span className={theme.textSecondary}>Stake SOL and receive mSOL (liquid staking token)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span className={theme.textSecondary}>mSOL value grows as staking rewards accrue</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span className={theme.textSecondary}>Gas fees sponsored by LazorKit Paymaster</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span className={theme.textSecondary}>Use mSOL in DeFi while earning staking rewards</span>
                                </div>
                            </div>
                        </div>

                        {/* What is mSOL */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>What is mSOL?</h2>
                            <div className={`space-y-3 text-sm ${theme.textSecondary}`}>
                                <p>
                                    <strong className={theme.textPrimary}>mSOL</strong> is Marinade's liquid staking token.
                                    When you stake SOL with Marinade, you receive mSOL in return.
                                </p>
                                <p>
                                    Unlike regular staking, mSOL is <strong className="text-green-600 dark:text-green-400 font-semibold">liquid</strong> &mdash;
                                    you can trade it, use it in DeFi, or unstake at any time.
                                </p>
                                <p>
                                    The mSOL/SOL exchange rate increases over time as staking rewards accrue.
                                    {msolPrice && (
                                        <span className={`${theme.textAccent} ml-1`}>
                                            Current rate: 1 mSOL = ~{msolPrice.toFixed(4)} SOL
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Token Account Rent Notice */}
                        <div className={`${theme.infoYellow} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
                                <span>💰</span> Token Account Rent
                            </h2>
                            <div className={`space-y-3 text-sm ${theme.textSecondary}`}>
                                <p>
                                    On your <strong className={theme.textPrimary}>first stake</strong>, Solana creates an mSOL token account
                                    which requires a one-time rent deposit of <strong className={theme.infoYellowTitle}>~0.002 SOL</strong>.
                                </p>
                                <p className={theme.textMuted}>
                                    This rent is <strong className="text-green-600 dark:text-green-400 font-semibold">fully reclaimable</strong> if you close the account later.
                                    The LazorKit paymaster covers gas fees, but rent is paid from your SOL balance.
                                </p>
                            </div>
                        </div>

                        {/* Making Marinade Work with LazorKit */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Making Marinade Work with LazorKit</h2>
                            <div className={`space-y-4 text-sm ${theme.textSecondary}`}>
                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>1.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Get Transaction from Marinade SDK</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        Initialize Marinade and build the stake/unstake transaction:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`const config = new MarinadeConfig({
  connection,
  publicKey: new PublicKey(wallet.smartWallet),
});
const marinade = new Marinade(config);

// Build stake transaction
const { transaction } = await marinade.deposit(
  new BN(amount * LAMPORTS_PER_SOL)
);`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>2.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Remove ComputeBudget Instructions</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        LazorKit manages compute budget automatically. Remove any ComputeBudget instructions from the SDK:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`const COMPUTE_BUDGET_PROGRAM = new PublicKey(
  'ComputeBudget111111111111111111111111111111'
);

const instructions = transaction.instructions.filter(
  ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM)
);`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>3.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Add Smart Wallet to All Instructions</span>
                                    </div>
                                    <p className={`ml-5 ${theme.textMuted} mb-2`}>
                                        LazorKit's <code className={`${theme.bgInput} px-1 rounded ${theme.textSecondary}`}>execute_cpi</code> validates that the smart wallet is present in ALL instruction account lists:
                                    </p>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`instructions.forEach((ix) => {
  const hasSmartWallet = ix.keys.some(
    k => k.pubkey.toBase58() === wallet.smartWallet
  );
  if (!hasSmartWallet) {
    ix.keys.push({
      pubkey: new PublicKey(wallet.smartWallet),
      isSigner: false,
      isWritable: false
    });
  }
});`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={theme.infoYellowTitle}>4.</span>
                                        <span className={`font-semibold ${theme.textPrimary}`}>Send via LazorKit</span>
                                    </div>
                                    <div className={`${theme.codeBlock} rounded-lg p-3 overflow-x-auto`}>
                                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                            {`await signAndSendTransaction({
  instructions,
  transactionOptions: { computeUnitLimit: 400_000 }
});`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4">
                                    <p className={`text-xs ${theme.textMuted}`}>
                                        💡 This pattern applies to most Solana protocols when integrating with LazorKit
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>What You'll Learn</h2>
                            <ul className={`space-y-3 text-sm ${theme.textSecondary}`}>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span>Integrate Marinade SDK with LazorKit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span>Process external SDK transactions for LazorKit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span>Fetch real-time quotes from Marinade state</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                                    <span>Display liquid staking token (mSOL) balances</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel - Staking Interface */}
                    <div className="space-y-6">
                        <div className={`${theme.bgCard} rounded-2xl p-8`}>
                            {!isConnected ? (
                                <div className="text-center space-y-6">
                                    <div>
                                        <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Connect Your Wallet</h3>
                                        <p className={`${theme.textMuted} text-sm`}>
                                            Use LazorKit smart wallet for gasless staking
                                        </p>
                                    </div>
                                    <button
                                        onClick={connect}
                                        disabled={connecting}
                                        className={`w-full ${theme.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Wallet Info */}
                                    <div>
                                        <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Liquid Staking</h3>
                                        <p className={`${theme.textMuted} text-sm`}>
                                            {wallet?.smartWallet.slice(0, 4)}...{wallet?.smartWallet.slice(-4)}
                                        </p>
                                    </div>

                                    {/* Balances */}
                                    <div className={`${theme.bgCardAlt} rounded-xl p-4`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`text-sm ${theme.textSecondary} font-semibold`}>Balances</span>
                                            <button
                                                onClick={refreshAll}
                                                disabled={refreshing || loadingMsol}
                                                className={`text-xs ${theme.textAccent} hover:opacity-80 disabled:opacity-50 flex items-center gap-1`}
                                            >
                                                <span className={(refreshing || loadingMsol) ? 'animate-spin' : ''}>🔄</span>
                                                {(refreshing || loadingMsol) ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className={theme.textMuted}>SOL:</span>
                                                <span className={`${theme.textPrimary} font-semibold`}>
                                                    {solBalance?.toFixed(4) || '0.0000'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className={theme.textMuted}>mSOL:</span>
                                                <span className={`${theme.textPrimary} font-semibold`}>
                                                    {msolBalance?.toFixed(6) || '0.000000'}
                                                </span>
                                            </div>
                                            {msolPrice && (
                                                <div className="flex justify-between text-xs pt-2">
                                                    <span className={theme.textMuted}>mSOL Price:</span>
                                                    <span className={theme.textAccent}>
                                                        1 mSOL = {msolPrice.toFixed(4)} SOL
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('stake')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'stake'
                                                ? theme.btnPrimary.replace('hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[4px_4px_0px_0px_#5B41C5]', '')
                                                : `bg-gray-100 dark:bg-white/5 ${theme.textSecondary} hover:bg-gray-200 dark:hover:bg-white/10`
                                                }`}
                                        >
                                            Stake
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('unstake')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'unstake'
                                                ? theme.btnPrimary.replace('hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[4px_4px_0px_0px_#5B41C5]', '')
                                                : `bg-gray-100 dark:bg-white/5 ${theme.textSecondary} hover:bg-gray-200 dark:hover:bg-white/10`
                                                }`}
                                        >
                                            Unstake
                                        </button>
                                    </div>

                                    {/* Stake Tab */}
                                    {activeTab === 'stake' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className={`text-sm ${theme.textSecondary}`}>Amount to Stake</label>
                                                <div className={`${theme.bgInput} rounded-xl p-4`}>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <input
                                                            type="number"
                                                            placeholder="0.0"
                                                            value={stakeAmount}
                                                            onChange={(e) => setStakeAmount(e.target.value)}
                                                            className={`bg-transparent ${theme.textPrimary} text-2xl font-semibold outline-none w-full`}
                                                            step="0.001"
                                                            min="0"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setStakeAmount((solBalance || 0).toString())}
                                                                className={`text-xs ${theme.textAccent} hover:opacity-80 px-2 py-1 rounded ${theme.infoPurple}`}
                                                            >
                                                                MAX
                                                            </button>
                                                            <span className={`${theme.textPrimary} font-semibold`}>SOL</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center">
                                                <span className={`text-2xl ${theme.textMuted}`}>&#8595;</span>
                                            </div>

                                            <div className="space-y-2">
                                                <label className={`text-sm ${theme.textSecondary}`}>You Receive</label>
                                                <div className={`${theme.bgInput} rounded-xl p-4`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`${theme.textPrimary} text-2xl font-semibold`}>
                                                            ~{estimatedMsol}
                                                        </span>
                                                        <span className={`${theme.textPrimary} font-semibold`}>mSOL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleStake}
                                                disabled={staking || !stakeAmount}
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {staking ? 'Staking...' : 'Stake (Gas-Free)'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Unstake Tab */}
                                    {activeTab === 'unstake' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className={`text-sm ${theme.textSecondary}`}>Amount to Unstake</label>
                                                <div className={`${theme.bgInput} rounded-xl p-4`}>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <input
                                                            type="number"
                                                            placeholder="0.0"
                                                            value={unstakeAmount}
                                                            onChange={(e) => setUnstakeAmount(e.target.value)}
                                                            className={`bg-transparent ${theme.textPrimary} text-2xl font-semibold outline-none w-full`}
                                                            step="0.000001"
                                                            min="0"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setUnstakeAmount((msolBalance || 0).toString())}
                                                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 px-2 py-1 rounded bg-purple-100 dark:bg-purple-500/20"
                                                            >
                                                                MAX
                                                            </button>
                                                            <span className={`${theme.textPrimary} font-semibold`}>mSOL</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center">
                                                <span className={`text-2xl ${theme.textMuted}`}>&#8595;</span>
                                            </div>

                                            <div className="space-y-2">
                                                <label className={`text-sm ${theme.textSecondary}`}>You Receive</label>
                                                <div className={`${theme.bgInput} rounded-xl p-4`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className={`${theme.textPrimary} text-2xl font-semibold`}>
                                                                {quoteLoading ? (
                                                                    <span className={theme.textMuted}>Loading...</span>
                                                                ) : unstakeQuote ? (
                                                                    `~${unstakeQuote.solOutput.toFixed(6)}`
                                                                ) : (
                                                                    '0.000000'
                                                                )}
                                                            </span>
                                                            {unstakeQuote && (
                                                                <div className={`text-xs ${theme.infoYellowText} mt-1`}>
                                                                    Pool fee: {(unstakeQuote.feeBp / 100).toFixed(2)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`${theme.textPrimary} font-semibold`}>SOL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleInstantUnstake}
                                                disabled={unstaking || !unstakeAmount || quoteLoading}
                                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {unstaking ? 'Processing...' : 'Unstake (Gas-Free)'}
                                            </button>
                                        </div>
                                    )}

                                    <div className={`text-xs ${theme.textMuted} text-center`}>
                                        No gas fees &bull; Powered by LazorKit
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Last Transaction */}
                        {lastTxSignature && (
                            <div className="bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-2xl p-6">
                                <h2 className={`text-xl font-bold ${theme.textPrimary} mb-3`}>Last Transaction</h2>
                                <a
                                    href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 text-sm break-all"
                                >
                                    {lastTxSignature}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
