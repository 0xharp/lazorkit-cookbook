import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { RAYDIUM_DEV_SWAP_HOST, RAYDIUM_DEV_BASE_HOST, RAYDIUM_DEV_PRIORITY_FEE, COMPUTE_UNITS } from '@/lib/constants';
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
import {
    getConnection,
    getSolBalance,
    getUsdcBalance,
    getAssociatedTokenAddressSync,
} from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';
import { colors, spacing, borderRadius, fontSize, commonStyles } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { Stack } from 'expo-router';

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

type TokenSymbol = 'SOL' | 'USDC';

export default function RaydiumSwapScreen() {
    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWallet();

    const [inputToken, setInputToken] = useState<TokenSymbol>('SOL');
    const [outputToken, setOutputToken] = useState<TokenSymbol>('USDC');
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [quoteError, setQuoteError] = useState('');
    const [swapping, setSwapping] = useState(false);
    const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const balances = {
        SOL: solBalance ?? 0,
        USDC: usdcBalance ?? 0,
    };

    const fetchBalances = async () => {
        if (!wallet?.smartWallet) return;

        setRefreshing(true);
        try {
            const connection = getConnection();
            const publicKey = new PublicKey(wallet.smartWallet);

            const [sol, usdc] = await Promise.all([
                getSolBalance(connection, publicKey),
                getUsdcBalance(connection, publicKey),
            ]);

            setSolBalance(sol);
            setUsdcBalance(usdc);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isConnected && wallet?.smartWallet) {
            fetchBalances();
        } else {
            setSolBalance(null);
            setUsdcBalance(null);
        }
    }, [isConnected, wallet?.smartWallet]);

    // Get quote when input changes
    useEffect(() => {
        const getQuote = async () => {
            if (!wallet || !inputAmount || parseFloat(inputAmount) <= 0) {
                setOutputAmount('');
                setQuoteError('');
                return;
            }

            setQuoteError('');
            try {
                const inputMint = TOKENS[inputToken].mint;
                const outputMint = TOKENS[outputToken].mint;
                const amount = parseFloat(inputAmount) * Math.pow(10, TOKENS[inputToken].decimals);

                const url = `${RAYDIUM_DEV_SWAP_HOST}/compute/swap-base-in?` +
                    `inputMint=${inputMint}&` +
                    `outputMint=${outputMint}&` +
                    `amount=${Math.floor(amount)}&` +
                    `slippageBps=50&` +
                    `txVersion=LEGACY`;

                const quoteResponse = await fetch(url);

                if (!quoteResponse.ok) {
                    const errorText = await quoteResponse.text();
                    console.error('Quote API error:', quoteResponse.status, errorText);
                    throw new Error(`API error: ${quoteResponse.status}`);
                }

                const quoteData = await quoteResponse.json();

                if (!quoteData.success) {
                    const errorMsg = quoteData.msg || quoteData.message || 'No liquidity available for this pair';
                    throw new Error(errorMsg);
                }

                if (!quoteData.data) {
                    throw new Error('No quote data returned');
                }

                const outputAmountRaw = parseFloat(quoteData.data.outputAmount);
                const formattedOutput = (
                    outputAmountRaw / Math.pow(10, TOKENS[outputToken].decimals)
                ).toFixed(6);

                setOutputAmount(formattedOutput);
            } catch (err: any) {
                console.error('Quote error:', err);
                setQuoteError(err.message || 'Failed to get quote');
                setOutputAmount('');
            }
        };

        const timeoutId = setTimeout(getQuote, 500);
        return () => clearTimeout(timeoutId);
    }, [inputAmount, inputToken, outputToken, wallet]);

    const handleConnect = () => {
        connect('examples/03-raydium-swap');
    };

    const handleFlipTokens = () => {
        setInputToken(outputToken);
        setOutputToken(inputToken);
        setInputAmount('');
        setOutputAmount('');
        setQuoteError('');
    };

    const handleSwap = async () => {
        if (!wallet?.smartWallet || !inputAmount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        Keyboard.dismiss();

        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Error', 'Invalid amount');
            return;
        }

        if (amount > balances[inputToken]) {
            Alert.alert(
                'Insufficient Balance',
                `You have ${balances[inputToken]?.toFixed(4) || '0'} ${inputToken}`
            );
            return;
        }

        setSwapping(true);
        setLastTxSignature(null);

        try {
            const inputMint = TOKENS[inputToken].mint;
            const outputMint = TOKENS[outputToken].mint;
            const amountIn = Math.floor(amount * Math.pow(10, TOKENS[inputToken].decimals));

            // Get quote
            const { data: swapResponse } = await axios.get(
                `${RAYDIUM_DEV_SWAP_HOST}/compute/swap-base-in?` +
                `inputMint=${inputMint}&outputMint=${outputMint}&` +
                `amount=${amountIn}&slippageBps=50&txVersion=LEGACY`
            );

            // Get priority fees
            const { data: priorityFeeData } = await axios.get(
                `${RAYDIUM_DEV_BASE_HOST}${RAYDIUM_DEV_PRIORITY_FEE}`
            );

            // Request LEGACY transaction from Raydium
            const { data: swapData } = await axios.post(
                `${RAYDIUM_DEV_SWAP_HOST}/transaction/swap-base-in`,
                {
                    computeUnitPriceMicroLamports: String(priorityFeeData.data.default.h),
                    swapResponse,
                    txVersion: 'LEGACY',
                    wallet: wallet.smartWallet,
                    wrapSol: inputMint === TOKENS.SOL.mint,
                    unwrapSol: outputMint === TOKENS.SOL.mint,
                    inputAccount:
                        inputMint === TOKENS.SOL.mint
                            ? undefined
                            : getAssociatedTokenAddressSync(
                                new PublicKey(inputMint),
                                new PublicKey(wallet.smartWallet)
                            ).toBase58(),
                    outputAccount:
                        outputMint === TOKENS.SOL.mint
                            ? undefined
                            : getAssociatedTokenAddressSync(
                                new PublicKey(outputMint),
                                new PublicKey(wallet.smartWallet)
                            ).toBase58(),
                }
            );

            // Deserialize as Legacy Transaction
            const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
            const legacyTx = Transaction.from(txBuffer);

            // Process instructions for LazorKit
            const instructions = processInstructionsForLazorKit(
                legacyTx.instructions,
                wallet.smartWallet
            );

            // Send to LazorKit
            const signature = await signAndSendTransaction(
                {
                    instructions,
                    transactionOptions: {
                        computeUnitLimit: COMPUTE_UNITS.SWAP,
                    },
                },
                'examples/03-raydium-swap'
            );

            setLastTxSignature(signature as string);
            setInputAmount('');
            setOutputAmount('');
            setQuoteError('');
            await fetchBalances();

            Alert.alert(
                'Swap Successful! 🎉',
                `Swapped ${amount} ${inputToken} for ~${outputAmount} ${outputToken}\n\nNo gas fees paid!`
            );
        } catch (err: any) {
            console.error('Swap error:', err);

            let errorMessage = err.message || 'Unknown error occurred';

            if (errorMessage.includes('0x1')) {
                errorMessage = 'Insufficient SOL for rent. Get SOL from Solana Devnet faucet.';
            } else if (errorMessage.includes('slippage')) {
                errorMessage = 'Slippage exceeded. Try again or increase slippage tolerance.';
            } else if (errorMessage.includes('No liquidity')) {
                errorMessage = 'No liquidity pool found on Devnet.';
            } else if (
                errorMessage.includes('SBF program panicked') ||
                errorMessage.includes('Option::unwrap()') ||
                errorMessage.includes('Program failed to complete')
            ) {
                errorMessage = `Devnet pool error for ${inputToken}→${outputToken}. Try swapping ${outputToken}→${inputToken} instead, or try a smaller amount.`;
            }

            Alert.alert('Swap Failed', errorMessage);
        } finally {
            setSwapping(false);
        }
    };

    const canSwap = inputAmount.trim() !== '' && !quoteError && !swapping;

    return (
        <>
        <Stack.Screen
            options={{
                title: 'Gasless Raydium Token Swaps',
            }}
        />
        <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>🔄</Text>
                        <Text style={styles.title}>Gasless Token Swaps with Raydium</Text>
                        <Text style={styles.subtitle}>
                            Swap tokens on Raydium DEX without paying gas fees
                        </Text>
                    </View>

                    {/* Devnet Warning */}
                    <View style={styles.warningCard}>
                        <Text style={styles.warningTitle}>⚠️ Devnet Limitations</Text>
                        <Text style={styles.warningText}>
                            Supporting SOL ↔ USDC pair. Some swap directions may fail due to pool
                            limitations. Try swapping in the other direction if needed.
                        </Text>
                    </View>

                    {!isConnected ? (
                        /* Not Connected State */
                        <View style={styles.glassCard}>
                            <Text style={styles.lockIcon}>🔄</Text>
                            <Text style={styles.connectTitle}>Connect to Start</Text>
                            <Text style={styles.connectDescription}>
                                Connect your wallet to swap tokens gaslessly
                            </Text>

                            <TouchableOpacity
                                onPress={handleConnect}
                                disabled={connecting}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.button.primary.start, colors.button.primary.end]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.connectButton}
                                >
                                    <Text style={styles.connectButtonText}>
                                        {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Swap Interface */
                        <View style={styles.swapContainer}>
                            {/* Balances Card */}
                            <View style={styles.balancesCard}>
                                <View style={styles.balancesHeader}>
                                    <Text style={styles.balancesTitle}>Your Balances</Text>
                                    <TouchableOpacity onPress={fetchBalances} disabled={refreshing}>
                                        <Text style={styles.refreshText}>
                                            {refreshing ? '⏳' : '🔄'} Refresh
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.balancesRow}>
                                    <View style={styles.balanceItem}>
                                        <Text style={styles.balanceLabel}>SOL</Text>
                                        <Text style={styles.balanceValue}>{balances.SOL.toFixed(4)}</Text>
                                    </View>
                                    <View style={styles.balanceItem}>
                                        <Text style={styles.balanceLabel}>USDC</Text>
                                        <Text style={styles.balanceValue}>{balances.USDC.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Swap Card */}
                            <View style={styles.swapCard}>
                                {/* Input Token */}
                                <View style={styles.tokenSection}>
                                    <Text style={styles.tokenLabel}>You Pay</Text>
                                    <View style={styles.tokenInputRow}>
                                        <TextInput
                                            style={styles.tokenInput}
                                            placeholder="0.0"
                                            placeholderTextColor={colors.text.placeholder}
                                            value={inputAmount}
                                            onChangeText={setInputAmount}
                                            keyboardType="decimal-pad"
                                        />
                                        <View style={styles.tokenSelector}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.tokenButton,
                                                    inputToken === 'SOL' && styles.tokenButtonActive,
                                                ]}
                                                onPress={() => {
                                                    if (inputToken !== 'SOL') {
                                                        setInputToken('SOL');
                                                        setOutputToken('USDC');
                                                        setInputAmount('');
                                                        setOutputAmount('');
                                                    }
                                                }}
                                            >
                                                <Text style={styles.tokenButtonText}>SOL</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.tokenButton,
                                                    inputToken === 'USDC' && styles.tokenButtonActive,
                                                ]}
                                                onPress={() => {
                                                    if (inputToken !== 'USDC') {
                                                        setInputToken('USDC');
                                                        setOutputToken('SOL');
                                                        setInputAmount('');
                                                        setOutputAmount('');
                                                    }
                                                }}
                                            >
                                                <Text style={styles.tokenButtonText}>USDC</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Flip Button */}
                                <View style={styles.flipContainer}>
                                    <TouchableOpacity style={styles.flipButton} onPress={handleFlipTokens}>
                                        <Text style={styles.flipText}>⇅</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Output Token */}
                                <View style={styles.tokenSection}>
                                    <Text style={styles.tokenLabel}>You Receive</Text>
                                    <View style={styles.tokenInputRow}>
                                        <Text style={styles.outputValue}>{outputAmount || '0.0'}</Text>
                                        <View style={styles.outputTokenBadge}>
                                            <Text style={styles.outputTokenText}>{outputToken}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Quote Error */}
                                {quoteError && (
                                    <View style={styles.errorCard}>
                                        <Text style={styles.errorText}>{quoteError}</Text>
                                    </View>
                                )}

                                {/* Swap Button */}
                                <TouchableOpacity
                                    onPress={handleSwap}
                                    disabled={!canSwap}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={
                                            canSwap
                                                ? [colors.button.success.start, colors.button.success.end]
                                                : ['#374151', '#374151']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.swapButton, !canSwap && styles.swapButtonDisabled]}
                                    >
                                        <Text style={styles.swapButtonText}>
                                            {swapping ? 'Swapping...' : 'Swap (Gasless!)'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <Text style={styles.poweredBy}>
                                    ✨ No gas fees • Powered by LazorKit + Raydium
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* How It Works */}
                    <View style={styles.howItWorksCard}>
                        <Text style={styles.sectionTitle}>Integration Pattern</Text>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Request LEGACY Transaction</Text>
                                <Text style={styles.stepDescription}>
                                    Request txVersion: 'LEGACY' from Raydium API for simpler
                                    instruction handling.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Process for LazorKit</Text>
                                <Text style={styles.stepDescription}>
                                    Filter ComputeBudget instructions and add smart wallet to all
                                    instruction accounts.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Send via Paymaster</Text>
                                <Text style={styles.stepDescription}>
                                    LazorKit's paymaster sponsors gas fees, user signs with passkey.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Code Example */}
                    <View style={styles.codeCard}>
                        <Text style={styles.sectionTitle}>Key Code</Text>
                        <View style={styles.codeBlock}>
                            <Text style={styles.code}>
{`// Process Raydium tx for LazorKit
const instructions = processInstructionsForLazorKit(
  legacyTx.instructions,
  wallet.smartWallet
);

// Send gasless swap
await signAndSendTransaction({
  instructions,
  transactionOptions: {
    computeUnitLimit: 600_000,
  },
});`}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <Footer />
        </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },

    // Header
    header: {
        marginBottom: spacing.md,
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSize.base,
        color: colors.text.muted,
    },

    // Warning
    warningCard: {
        backgroundColor: colors.status.warningBg,
        borderWidth: 1,
        borderColor: colors.status.warningBorder,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    warningTitle: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.status.warning,
        marginBottom: spacing.xs,
    },
    warningText: {
        fontSize: fontSize.sm,
        color: colors.status.warning,
        lineHeight: 20,
    },

    // Connect State
    glassCard: {
        ...commonStyles.glassCard,
        padding: spacing.xl,
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    connectTitle: {
        fontSize: fontSize.xl,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    connectDescription: {
        fontSize: fontSize.base,
        color: colors.text.muted,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    connectButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        ...commonStyles.shadow,
    },
    connectButtonText: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
    },

    // Swap Interface
    swapContainer: {
        gap: spacing.md,
    },
    balancesCard: {
        backgroundColor: colors.status.successBg,
        borderWidth: 1,
        borderColor: colors.status.successBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    balancesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    balancesTitle: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: 'rgba(134, 239, 172, 0.8)',
    },
    refreshText: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
    },
    balancesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    balanceItem: {
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: fontSize.xs,
        color: 'rgba(134, 239, 172, 0.8)',
        marginBottom: spacing.xs,
    },
    balanceValue: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: colors.text.primary,
    },
    swapCard: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
    },
    tokenSection: {
        backgroundColor: colors.background.input,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    tokenLabel: {
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    tokenInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    tokenInput: {
        flex: 1,
        fontSize: fontSize['2xl'],
        fontWeight: '600',
        color: colors.text.primary,
        padding: 0,
    },
    tokenSelector: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    tokenButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: '#374151',
    },
    tokenButtonActive: {
        backgroundColor: colors.accent.purpleDark,
    },
    tokenButtonText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    outputValue: {
        flex: 1,
        fontSize: fontSize['2xl'],
        fontWeight: '600',
        color: colors.text.primary,
    },
    outputTokenBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.accent.purpleDark,
    },
    outputTokenText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    flipContainer: {
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    flipButton: {
        backgroundColor: colors.background.card,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    flipText: {
        fontSize: 24,
        color: colors.text.primary,
    },
    errorCard: {
        backgroundColor: colors.status.errorBg,
        borderWidth: 1,
        borderColor: colors.status.errorBorder,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginTop: spacing.sm,
    },
    errorText: {
        fontSize: fontSize.sm,
        color: colors.status.error,
    },
    swapButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
        ...commonStyles.shadow,
    },
    swapButtonDisabled: {
        opacity: 0.5,
    },
    swapButtonText: {
        fontSize: fontSize.base,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
    },
    poweredBy: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        textAlign: 'center',
        marginTop: spacing.md,
    },

    // How It Works
    howItWorksCard: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    step: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accent.purpleDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    stepNumberText: {
        fontSize: fontSize.sm,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    stepDescription: {
        fontSize: fontSize.sm,
        color: colors.text.muted,
        lineHeight: 20,
    },

    // Code
    codeCard: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    codeBlock: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
    },
    code: {
        fontSize: 11,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        lineHeight: 18,
    },
});
