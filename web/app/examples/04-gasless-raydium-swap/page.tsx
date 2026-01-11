'use client';

import { useState, useEffect } from 'react';
import {
    PublicKey,
    Transaction
} from '@solana/web3.js';
import Link from 'next/link';
import axios from "axios";
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2'
import { useBalances } from '@/hooks/useBalances';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { getAssociatedTokenAddressSync, getConnection, formatTransactionError } from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';

const TOKENS = {
    SOL: {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
    },
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        decimals: 6,
    },
};

interface SwapCompute {
    id: string
    success: true
    version: string
    openTime?: undefined
    msg: undefined
    data: {
        swapType: 'BaseIn' | 'BaseOut'
        inputMint: string
        inputAmount: string
        outputMint: string
        outputAmount: string
        otherAmountThreshold: string
        slippageBps: number
        priceImpactPct: number
        routePlan: any
    }
}

export default function Recipe04() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const [inputToken, setInputToken] = useState<'SOL' | 'USDC'>('SOL');
    const [outputToken, setOutputToken] = useState<'SOL' | 'USDC'>('USDC');
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [quoteError, setQuoteError] = useState('');
    const [swapping, setSwapping] = useState(false);
    const [lastTxSignature, setLastTxSignature] = useState('');

    const {
        solBalance,
        usdcBalance,
        loading: refreshing,
        fetchBalances,
    } = useBalances(isConnected ? wallet?.smartWallet : null);

    // Create a balances object for easy access by token symbol
    const balances = {
        SOL: solBalance ?? 0,
        USDC: usdcBalance ?? 0,
    };

    // Calculate output amount (price quote)
    const calculateOutputAmount = async () => {
        if (!wallet || !inputAmount || parseFloat(inputAmount) <= 0) {
            setOutputAmount('');
            setQuoteError('');
            return;
        }

        setQuoteError('');
        try {
            const inputMint = TOKENS[inputToken as keyof typeof TOKENS].mint;
            const outputMint = TOKENS[outputToken as keyof typeof TOKENS].mint;
            const amount = parseFloat(inputAmount) * Math.pow(10, TOKENS[inputToken as keyof typeof TOKENS].decimals);

            const quoteResponse = await fetch(
                `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
                `inputMint=${inputMint}&` +
                `outputMint=${outputMint}&` +
                `amount=${Math.floor(amount)}&` +
                `slippageBps=50&` +
                `txVersion=LEGACY`
            );

            if (!quoteResponse.ok) {
                throw new Error('Failed to get quote from Raydium API');
            }

            const quoteData = await quoteResponse.json();

            if (!quoteData.success || !quoteData.data) {
                throw new Error('No liquidity available for this pair');
            }

            const outputAmountRaw = parseFloat(quoteData.data.outputAmount);
            const formattedOutput = (outputAmountRaw / Math.pow(10, TOKENS[outputToken as keyof typeof TOKENS].decimals)).toFixed(6);

            setOutputAmount(formattedOutput);
        } catch (err: any) {
            console.error('Quote error:', err);
            setQuoteError(err.message || 'Failed to get quote');
            setOutputAmount('');
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(calculateOutputAmount, 500);
        return () => clearTimeout(timeoutId);
    }, [inputAmount, inputToken, outputToken]);

    const handleSwap = async () => {
        if (!wallet || !inputAmount) {
            alert('Please enter an amount');
            return;
        }

        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid amount');
            return;
        }

        if (amount > (balances[inputToken] || 0)) {
            alert(`Insufficient ${inputToken} balance. You have ${balances[inputToken]?.toFixed(4) || '0'} ${inputToken}.`);
            return;
        }

        setSwapping(true);
        try {
            const inputMint = TOKENS[inputToken as keyof typeof TOKENS].mint;
            const outputMint = TOKENS[outputToken as keyof typeof TOKENS].mint;
            const amountIn = Math.floor(amount * Math.pow(10, TOKENS[inputToken as keyof typeof TOKENS].decimals));

            // Get quote
            let { data: swapResponse } = await axios.get<SwapCompute>(
                `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountIn}&slippageBps=50&txVersion=LEGACY`
            );

            const { data: priorityFeeData } = await axios.get<{
                id: string
                success: boolean
                data: { default: { vh: number; h: number; m: number } }
            }>(`${DEV_API_URLS.BASE_HOST}${DEV_API_URLS.PRIORITY_FEE}`);

            // Request LEGACY transaction from Raydium
            const { data: swapData } = await axios.post<{
                id: string
                version: string
                success: boolean
                data: { transaction: string }[]
            }>(`${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
                computeUnitPriceMicroLamports: String(priorityFeeData.data.default.h),
                swapResponse,
                txVersion: 'LEGACY',
                wallet: wallet.smartWallet,
                wrapSol: inputMint === TOKENS.SOL.mint,
                unwrapSol: outputMint === TOKENS.SOL.mint,
                inputAccount: inputMint === TOKENS.SOL.mint ? undefined : getAssociatedTokenAddressSync(new PublicKey(inputMint), new PublicKey(wallet.smartWallet)).toBase58(),
                outputAccount: outputMint === TOKENS.SOL.mint ? undefined : getAssociatedTokenAddressSync(new PublicKey(outputMint), new PublicKey(wallet.smartWallet)).toBase58(),
            });

            // Deserialize as Legacy Transaction
            const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
            const legacyTx = Transaction.from(txBuffer);

            // Process instructions for LazorKit:
            // 1. Remove ComputeBudget instructions (LazorKit handles compute)
            // 2. Add smart wallet to all instructions (LazorKit validation requirement)
            const instructions = processInstructionsForLazorKit(
                legacyTx.instructions,
                wallet.smartWallet
            );

            // Send to LazorKit
            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 600_000
                }
            });

            setLastTxSignature(signature);

            alert(
                `✅ Swap successful!\n\n` +
                `Swapped: ${amount} ${inputToken}\n` +
                `For: ~${outputAmount} ${outputToken}\n\n` +
                `💰 No gas fees paid!`
            );

            setInputAmount('');
            setOutputAmount('');
            setQuoteError('');
            await fetchBalances();

        } catch (err: any) {
            console.error('Swap error:', err);

            let errorMessage = err.message || 'Unknown error occurred';

            if (errorMessage.includes('0x1')) {
                errorMessage = 'Insufficient SOL for rent. Get SOL from Solana Devnet faucet.';
            } else if (errorMessage.includes('slippage')) {
                errorMessage = 'Slippage exceeded. Try again or increase slippage tolerance.';
            } else if (errorMessage.includes('No liquidity')) {
                errorMessage = 'No liquidity pool found on Devnet.';
            } else if (errorMessage.includes('transaction too large') || errorMessage.includes('Transaction too large')) {
                errorMessage = 'Transaction too large. Try a simpler swap with fewer routing hops.';
            } else if (errorMessage.includes('SBF program panicked') || errorMessage.includes('Option::unwrap()') || errorMessage.includes('Program failed to complete')) {
                errorMessage = `Devnet pool error for ${inputToken}→${outputToken}. The pool may be imbalanced or have insufficient liquidity in this direction. Try swapping ${outputToken}→${inputToken} instead, or try a smaller amount.`;
            }

            alert(`Swap failed: ${errorMessage}`);
        } finally {
            setSwapping(false);
        }
    };

    const handleFlipTokens = () => {
        setInputToken(outputToken);
        setOutputToken(inputToken);
        setInputAmount('');
        setOutputAmount('');
        setQuoteError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
                    >
                        ← Back to Home
                    </Link>
                    <div className="flex items-start gap-3 mb-2">
                        <span className="text-4xl">🔄</span>
                        <div>
                            <h1 className="text-4xl font-bold text-white">
                                Gasless Token Swaps with Raydium
                            </h1>
                        </div>
                    </div>
                    <p className="text-gray-400">
                        Swap tokens on Raydium DEX without paying gas fees
                    </p>
                </div>

                {/* Devnet Warning */}
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h3 className="text-yellow-200 font-semibold mb-2">
                                Devnet Limitations
                            </h3>
                            <div className="text-sm text-yellow-100 space-y-2">
                                <p>
                                    Currently supporting <strong>SOL ↔ USDC</strong> pair on Devnet. Devnet liquidity pools can be
                                    unreliable - some swap directions may fail due to imbalanced pools or missing pool state.
                                </p>
                                <p className="mt-2">
                                    <strong>Note:</strong> If USDC→SOL fails, try SOL→USDC instead. This is a devnet pool limitation, not a code issue.
                                </p>
                                <p className="mt-2">
                                    💡 The same code works reliably on Mainnet where pools are properly maintained.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Info */}
                    <div className="space-y-6">
                        {/* Integration Highlight */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <span>🤝</span> Raydium x LazorKit
                            </h2>
                            <p className="text-sm text-gray-300 mb-4">
                                Integrating with an existing Solana protocol while maintaining gasless UX.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span className="text-gray-300">Raydium Trade API for swap routing</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span className="text-gray-300">LazorKit paymaster covers all gas fees</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span className="text-gray-300">Works on Solana Devnet (SOL-USDC pair)</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span className="text-gray-300">Swap more pairs on Mainnet</span>
                                </div>
                            </div>
                        </div>

                        {/* Integration Challenges & Solutions */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Making Raydium Work with LazorKit</h2>
                            <div className="space-y-4 text-sm text-gray-300">
                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-yellow-400">1.</span>
                                        <span className="font-semibold text-white">Use Legacy Transactions</span>
                                    </div>
                                    <p className="ml-5 text-gray-400">
                                        Request <code className="bg-black/30 px-1 rounded text-gray-300">txVersion: 'LEGACY'</code> from Raydium API to keep instructions simpler than versioned transactions.
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-yellow-400">2.</span>
                                        <span className="font-semibold text-white">Skip ComputeBudget Instructions</span>
                                    </div>
                                    <p className="ml-5 text-gray-400 mb-2">
                                        LazorKit manages compute budget automatically. Filter them out:
                                    </p>
                                    <code className="ml-5 block bg-black/30 p-2 rounded text-xs text-gray-300">
                                        instructions.filter(ix =&gt; !ix.programId.equals(COMPUTE_BUDGET_PROGRAM))
                                    </code>
                                </div>

                                <div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-yellow-400">3.</span>
                                        <span className="font-semibold text-white">Fix SyncNative Validation</span>
                                    </div>
                                    <p className="ml-5 text-gray-400 mb-2">
                                        LazorKit's <code className="bg-black/30 px-1 rounded text-gray-300">execute_cpi</code> expects smart wallet in ALL instructions. Some (like SyncNative) don't need it. Workaround:
                                    </p>
                                    <code className="ml-5 block bg-black/30 p-2 rounded text-xs text-gray-300">
                                        if (!hasSmartWallet) &#123;<br/>
                                        &nbsp;&nbsp;ix.keys.push(&#123; pubkey: smartWallet, isSigner: false, isWritable: false &#125;)<br/>
                                        &#125;
                                    </code>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-gray-400">
                                        💡 These patterns can be applied to most Solana protocols when integrating with LazorKit
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">What You'll Learn</h2>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Use Raydium Trade API for quotes & swaps</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Handling legacy transactions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Work around LazorKit validation quirks</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <span>Manage token accounts & balances</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel - Swap Interface */}
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
                            {!isConnected ? (
                                <div className="text-center space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
                                        <p className="text-gray-400 text-sm">
                                            Use LazorKit smart wallet for gasless swaps
                                        </p>
                                    </div>
                                    <button
                                        onClick={connect}
                                        disabled={connecting}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Swap Tokens</h3>
                                        <p className="text-gray-400 text-sm">
                                            {wallet?.smartWallet.slice(0, 4)}...{wallet?.smartWallet.slice(-4)}
                                        </p>
                                    </div>

                                    {/* Balances with Refresh */}
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm text-gray-300 font-semibold">Balances</span>
                                            <button
                                                onClick={fetchBalances}
                                                disabled={refreshing}
                                                className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                                                {refreshing ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">SOL:</span>
                                                <span className="text-white font-semibold">
                                                    {balances.SOL?.toFixed(4) || '0.0000'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">USDC:</span>
                                                <span className="text-white font-semibold">
                                                    {balances.USDC?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Token */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">You Pay</label>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <div className="flex justify-between items-center gap-4">
                                                <input
                                                    type="number"
                                                    placeholder="0.0"
                                                    value={inputAmount}
                                                    onChange={(e) => setInputAmount(e.target.value)}
                                                    className="bg-transparent text-white text-2xl font-semibold outline-none w-full"
                                                    step="0.000001"
                                                    min="0"
                                                />
                                                <select
                                                    value={inputToken}
                                                    onChange={(e) => setInputToken(e.target.value as 'SOL' | 'USDC')}
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer border-2 border-purple-500 hover:bg-purple-700 transition-colors"
                                                    style={{
                                                        WebkitAppearance: 'none',
                                                        MozAppearance: 'none',
                                                        appearance: 'none',
                                                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'right 0.5rem center',
                                                        backgroundSize: '1.5em 1.5em',
                                                        paddingRight: '2.5rem'
                                                    }}
                                                >
                                                    <option value="SOL" style={{ backgroundColor: '#6B21A8', color: 'white' }}>SOL</option>
                                                    <option value="USDC" style={{ backgroundColor: '#6B21A8', color: 'white' }}>USDC</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flip Button */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleFlipTokens}
                                            className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                                        >
                                            <span className="text-2xl">⇅</span>
                                        </button>
                                    </div>

                                    {/* Output Token */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">You Receive</label>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="text-white text-2xl font-semibold">
                                                    {outputAmount || '0.0'}
                                                </div>
                                                <select
                                                    value={outputToken}
                                                    onChange={(e) => setOutputToken(e.target.value as 'SOL' | 'USDC')}
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer border-2 border-purple-500 hover:bg-purple-700 transition-colors"
                                                    style={{
                                                        WebkitAppearance: 'none',
                                                        MozAppearance: 'none',
                                                        appearance: 'none',
                                                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'right 0.5rem center',
                                                        backgroundSize: '1.5em 1.5em',
                                                        paddingRight: '2.5rem'
                                                    }}
                                                >
                                                    <option value="SOL" style={{ backgroundColor: '#6B21A8', color: 'white' }}>SOL</option>
                                                    <option value="USDC" style={{ backgroundColor: '#6B21A8', color: 'white' }}>USDC</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {quoteError && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-200">
                                            {quoteError}
                                        </div>
                                    )}

                                    {/* Swap Button */}
                                    <button
                                        onClick={handleSwap}
                                        disabled={swapping || !inputAmount || !!quoteError}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {swapping ? 'Swapping...' : 'Swap (Gas-Free)'}
                                    </button>

                                    <div className="text-xs text-gray-400 text-center">
                                        No gas fees • Powered by LazorKit
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Last Transaction */}
                        {lastTxSignature && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-3">Last Transaction</h2>
                                <a
                                    href={`https://explorer.solana.com/tx/${lastTxSignature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-400 hover:text-green-300 text-sm break-all"
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