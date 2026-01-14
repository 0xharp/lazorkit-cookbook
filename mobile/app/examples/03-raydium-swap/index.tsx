import { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { RAYDIUM_DEV_SWAP_HOST, RAYDIUM_DEV_BASE_HOST, RAYDIUM_DEV_PRIORITY_FEE, COMPUTE_UNITS } from '@/lib/constants';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import {
    getConnection,
    getSolBalance,
    getUsdcBalance,
    getAssociatedTokenAddressSync,
} from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { spacing, fontSize } from '@/lib/theme';
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
    const theme = useThemeStyles();
    const { colors } = theme;

    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWalletConnect();

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
                        clusterSimulation: 'devnet',
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
            <Stack.Screen options={{ title: 'Gasless Raydium Token Swaps' }} />
            <LinearGradient
                colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                style={theme.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    style={theme.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={100}
                >
                    <ScrollView
                        style={theme.container}
                        contentContainerStyle={theme.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={{ marginBottom: spacing.md }}>
                            <Text style={theme.emoji}>🔄</Text>
                            <Text style={theme.title}>Gasless Token Swaps with Raydium</Text>
                            <Text style={theme.subtitle}>
                                Swap tokens on Raydium DEX without paying gas fees
                            </Text>
                        </View>

                        {/* Devnet Warning */}
                        <View style={[theme.cardWarning, { marginBottom: spacing.lg }]}>
                            <Text style={[theme.textWarning, { fontWeight: '600', marginBottom: spacing.xs }]}>
                                ⚠️ Devnet Limitations
                            </Text>
                            <Text style={[theme.textWarning, { fontSize: fontSize.sm }]}>
                                Supporting SOL ↔ USDC pair. Some swap directions may fail due to pool
                                limitations. Try swapping in the other direction if needed.
                            </Text>
                        </View>

                        {!isConnected ? (
                            /* Not Connected State */
                            <View style={[theme.card, { alignItems: 'center' }]}>
                                <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>🔄</Text>
                                <Text style={theme.sectionTitle}>Connect to Start</Text>
                                <Text style={[theme.textMuted, { textAlign: 'center', marginBottom: spacing.lg }]}>
                                    Connect your wallet to swap tokens gaslessly
                                </Text>

                                <TouchableOpacity
                                    onPress={handleConnect}
                                    disabled={connecting}
                                    activeOpacity={0.8}
                                    style={{ width: '100%' }}
                                >
                                    <LinearGradient
                                        colors={[colors.button.primary.start, colors.button.primary.end]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={theme.btnPrimary}
                                    >
                                        <Text style={theme.btnPrimaryText}>
                                            {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Swap Interface */
                            <View style={theme.section}>
                                {/* Balances Card */}
                                <View style={theme.balanceCard}>
                                    <View style={theme.rowBetween}>
                                        <Text style={[theme.balanceLabel, { fontWeight: '600' }]}>Your Balances</Text>
                                        <TouchableOpacity onPress={fetchBalances} disabled={refreshing}>
                                            <Text style={theme.refreshText}>
                                                {refreshing ? '⏳' : '🔄'} Refresh
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={theme.balanceRow}>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={theme.balanceLabel}>SOL</Text>
                                            <Text style={[theme.textPrimary, { fontSize: fontSize.lg, fontWeight: '600' }]}>
                                                {balances.SOL.toFixed(4)}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={theme.balanceLabel}>USDC</Text>
                                            <Text style={[theme.textPrimary, { fontSize: fontSize.lg, fontWeight: '600' }]}>
                                                {balances.USDC.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Swap Card */}
                                <View style={theme.card}>
                                    {/* Input Token */}
                                    <View style={theme.tokenSection}>
                                        <Text style={theme.tokenLabel}>You Pay</Text>
                                        <View style={theme.tokenInputRow}>
                                            <TextInput
                                                style={theme.tokenInput}
                                                placeholder="0.0"
                                                placeholderTextColor={colors.text.placeholder}
                                                value={inputAmount}
                                                onChangeText={setInputAmount}
                                                keyboardType="decimal-pad"
                                            />
                                            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                                                <TouchableOpacity
                                                    style={[
                                                        theme.tokenButton,
                                                        inputToken === 'SOL' && theme.tokenButtonActive,
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
                                                    <Text style={[
                                                        theme.tokenButtonText,
                                                        inputToken === 'SOL' && theme.tokenButtonTextActive,
                                                    ]}>SOL</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        theme.tokenButton,
                                                        inputToken === 'USDC' && theme.tokenButtonActive,
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
                                                    <Text style={[
                                                        theme.tokenButtonText,
                                                        inputToken === 'USDC' && theme.tokenButtonTextActive,
                                                    ]}>USDC</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Flip Button */}
                                    <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
                                        <TouchableOpacity style={theme.flipButton} onPress={handleFlipTokens}>
                                            <Text style={theme.flipText}>⇅</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Output Token */}
                                    <View style={theme.tokenSection}>
                                        <Text style={theme.tokenLabel}>You Receive</Text>
                                        <View style={theme.tokenInputRow}>
                                            <Text style={theme.outputValue}>{outputAmount || '0.0'}</Text>
                                            <View style={theme.outputBadge}>
                                                <Text style={[theme.tokenButtonText, theme.tokenButtonTextActive]}>{outputToken}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Quote Error */}
                                    {quoteError && (
                                        <View style={[theme.cardError, { marginTop: spacing.md }]}>
                                            <Text style={theme.textError}>{quoteError}</Text>
                                        </View>
                                    )}

                                    {/* Swap Button */}
                                    <TouchableOpacity
                                        onPress={handleSwap}
                                        disabled={!canSwap}
                                        activeOpacity={0.8}
                                        style={{ marginTop: spacing.md }}
                                    >
                                        <LinearGradient
                                            colors={
                                                canSwap
                                                    ? [colors.button.success.start, colors.button.success.end]
                                                    : [colors.button.disabled, colors.button.disabled]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[theme.btnSuccess, !canSwap && theme.btnDisabled]}
                                        >
                                            <Text style={theme.btnSuccessText}>
                                                {swapping ? 'Swapping...' : 'Swap (Gasless!)'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <Text style={[theme.textMuted, { textAlign: 'center', marginTop: spacing.md, fontSize: fontSize.sm }]}>
                                        ✨ No gas fees • Powered by LazorKit + Raydium
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* How It Works */}
                        <View style={[theme.card, { marginTop: spacing.lg }]}>
                            <Text style={theme.sectionTitle}>Integration Pattern</Text>

                            <View style={theme.stepRow}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>1</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Request LEGACY Transaction</Text>
                                    <Text style={theme.stepDescription}>
                                        Request txVersion: 'LEGACY' from Raydium API for simpler
                                        instruction handling.
                                    </Text>
                                </View>
                            </View>

                            <View style={theme.stepRow}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>2</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Process for LazorKit</Text>
                                    <Text style={theme.stepDescription}>
                                        Filter ComputeBudget instructions and add smart wallet to all
                                        instruction accounts.
                                    </Text>
                                </View>
                            </View>

                            <View style={[theme.stepRow, { marginBottom: 0 }]}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>3</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Send via Paymaster</Text>
                                    <Text style={theme.stepDescription}>
                                        LazorKit's paymaster sponsors gas fees, user signs with passkey.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Code Example */}
                        <View style={[theme.codeCard, { marginTop: spacing.md }]}>
                            <Text style={[theme.sectionTitle, { padding: spacing.md, paddingBottom: 0 }]}>Key Code</Text>
                            <View style={theme.codeHighlight}>
                                <Text style={theme.codeHighlightText}>
                                    📱 Mobile: Add redirectUrl option for deep link
                                </Text>
                            </View>
                            <View style={theme.codeBlock}>
                                <Text style={theme.codeText}>
                                    {`import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { signAndSendTransaction } = useWallet();

// Process Raydium tx for LazorKit
const instructions = processInstructionsForLazorKit(
  legacyTx.instructions,
  wallet.smartWallet
);

// Send gasless swap with redirect
await signAndSendTransaction(
  {
    instructions,
    transactionOptions: { computeUnitLimit: 600_000 },
  },
  { redirectUrl: Linking.createURL('return/path') }
);`}
                                </Text>
                            </View>
                            <View style={theme.codeNote}>
                                <Text style={theme.codeNoteText}>
                                    💡 This cookbook includes a WalletContext wrapper that simplifies
                                    state management across screens.{'\n\n'}
                                    📖 See:{' '}
                                    <Text
                                        style={theme.link}
                                        onPress={() =>
                                            Linking.openURL(
                                                'https://github.com/0xharp/lazorkit-cookbook/blob/main/docs/mobile/03-cookbook-patterns.md'
                                            )
                                        }
                                    >
                                        docs/mobile/03-cookbook-patterns.md
                                    </Text>
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
