import { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicKey } from '@solana/web3.js';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import {
    getConnection,
    getUsdcBalance,
    validateRecipientAddress,
    validateTransferAmount,
    buildUsdcTransferInstructions,
    withRetry,
    formatTransactionError,
} from '@/lib/solana-utils';
import { getExplorerUrl, COMPUTE_UNITS } from '@/lib/constants';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { spacing, fontSize } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { Stack } from 'expo-router';

export default function GaslessTransferScreen() {
    const theme = useThemeStyles();
    const { colors } = theme;

    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWalletConnect();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [sending, setSending] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBalance = async () => {
        if (!wallet?.smartWallet) return;

        setRefreshing(true);
        try {
            const connection = getConnection();
            const publicKey = new PublicKey(wallet.smartWallet);
            const balance = await getUsdcBalance(connection, publicKey);
            setUsdcBalance(balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isConnected && wallet?.smartWallet) {
            fetchBalance();
        } else {
            setUsdcBalance(null);
        }
    }, [isConnected, wallet?.smartWallet]);

    const handleConnect = () => {
        connect('examples/02-gasless-transfer');
    };

    const handleUseMax = () => {
        if (usdcBalance !== null) {
            setAmount(usdcBalance.toString());
        }
    };

    const handleTransfer = async () => {
        if (!wallet?.smartWallet) return;

        Keyboard.dismiss();

        const recipientValidation = validateRecipientAddress(recipient);
        if (!recipientValidation.valid) {
            Alert.alert('Invalid Recipient', recipientValidation.error);
            return;
        }

        const amountValidation = validateTransferAmount(amount, usdcBalance);
        if (!amountValidation.valid) {
            Alert.alert('Invalid Amount', amountValidation.error);
            return;
        }

        setSending(true);
        setRetryCount(0);
        setLastTxSignature(null);

        try {
            const connection = getConnection();
            const senderPubkey = new PublicKey(wallet.smartWallet);
            const recipientPubkey = recipientValidation.address!;

            const instructions = await buildUsdcTransferInstructions(
                connection,
                senderPubkey,
                recipientPubkey,
                amountValidation.amountNum!
            );

            const signature = await withRetry(
                async () => {
                    return signAndSendTransaction(
                        {
                            instructions,
                            transactionOptions: {
                                computeUnitLimit: COMPUTE_UNITS.TRANSFER,
                                clusterSimulation: 'devnet',
                            },
                        },
                        'examples/02-gasless-transfer'
                    );
                },
                {
                    maxRetries: 3,
                    initialDelayMs: 1000,
                    onRetry: (attempt) => {
                        setRetryCount(attempt);
                    },
                }
            );

            await connection.confirmTransaction(signature as string, 'confirmed');

            setLastTxSignature(signature as string);
            Alert.alert(
                'Transfer Successful! 🎉',
                `Sent ${amountValidation.amountNum} USDC with no gas fees!`
            );
            setRecipient('');
            setAmount('');
            await fetchBalance();
        } catch (error) {
            console.error('Transfer error:', error);
            Alert.alert('Transfer Failed', formatTransactionError(error, 'Transfer'));
        } finally {
            setSending(false);
            setRetryCount(0);
        }
    };

    const canSend = recipient.trim() !== '' && amount.trim() !== '' && !sending;

    return (
        <>
            <Stack.Screen options={{ title: 'Gasless USDC Transfer' }} />
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
                        <View style={{ marginBottom: spacing.lg }}>
                            <Text style={theme.emoji}>⚡</Text>
                            <Text style={theme.title}>Gasless USDC Transfer</Text>
                            <Text style={theme.subtitle}>
                                Send USDC without paying gas fees - LazorKit's paymaster covers it
                            </Text>
                        </View>

                        {!isConnected ? (
                            /* Not Connected State */
                            <View style={[theme.card, { alignItems: 'center' }]}>
                                <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>💸</Text>
                                <Text style={theme.sectionTitle}>Connect to Start</Text>
                                <Text style={[theme.textMuted, { textAlign: 'center', marginBottom: spacing.lg }]}>
                                    Connect your wallet to send gasless USDC transfers
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
                            /* Transfer Form */
                            <View style={theme.section}>
                                {/* Balance Card */}
                                <View style={theme.balanceCard}>
                                    <View style={theme.rowBetween}>
                                        <Text style={theme.balanceLabel}>Your USDC Balance</Text>
                                        <TouchableOpacity onPress={fetchBalance} disabled={refreshing}>
                                            <Text style={theme.refreshText}>
                                                {refreshing ? '⏳' : '🔄'} Refresh
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={theme.balanceValue}>
                                        {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : '...'}
                                    </Text>
                                    {usdcBalance === 0 && (
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL('https://faucet.circle.com/')}
                                        >
                                            <Text style={[theme.textWarning, { marginTop: spacing.sm, fontSize: fontSize.xs }]}>
                                                ⚠️ No USDC? Get some from Circle Faucet →
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Transfer Form Card */}
                                <View style={theme.card}>
                                    <Text style={theme.sectionTitle}>Send USDC</Text>

                                    <View style={{ marginBottom: spacing.md }}>
                                        <Text style={theme.inputLabel}>Recipient Address</Text>
                                        <TextInput
                                            style={theme.input}
                                            placeholder="Enter Solana address..."
                                            placeholderTextColor={colors.text.placeholder}
                                            value={recipient}
                                            onChangeText={setRecipient}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={{ marginBottom: spacing.md }}>
                                        <View style={theme.rowBetween}>
                                            <Text style={theme.inputLabel}>Amount (USDC)</Text>
                                            {usdcBalance !== null && usdcBalance > 0 && (
                                                <TouchableOpacity onPress={handleUseMax}>
                                                    <Text style={theme.textAccent}>
                                                        Use Max ({usdcBalance.toFixed(2)})
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <TextInput
                                            style={theme.input}
                                            placeholder="0.00"
                                            placeholderTextColor={colors.text.placeholder}
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleTransfer}
                                        disabled={!canSend}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={
                                                canSend
                                                    ? [colors.button.success.start, colors.button.success.end]
                                                    : [colors.button.disabled, colors.button.disabled]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[theme.btnSuccess, !canSend && theme.btnDisabled]}
                                        >
                                            <Text style={canSend ? theme.btnSuccessText : theme.btnDisabledText}>
                                                {sending
                                                    ? retryCount > 0
                                                        ? `Retrying... (${retryCount}/3)`
                                                        : 'Sending...'
                                                    : 'Send USDC (Gasless!)'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View style={[theme.cardWarning, { marginTop: spacing.md }]}>
                                        <Text style={[theme.textWarning, { textAlign: 'center', fontSize: fontSize.sm }]}>
                                            ✨ 100% Gasless - LazorKit's paymaster covers all fees
                                        </Text>
                                    </View>
                                </View>

                                {/* Last Transaction */}
                                {lastTxSignature && (
                                    <TouchableOpacity
                                        style={theme.card}
                                        onPress={() => Linking.openURL(getExplorerUrl(lastTxSignature))}
                                    >
                                        <Text style={theme.textMuted}>Last Transaction:</Text>
                                        <Text style={[theme.textAccent, { fontFamily: 'monospace', fontSize: fontSize.xs }]}>
                                            {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-20)} ↗
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* How It Works */}
                        <View style={[theme.card, { marginTop: spacing.lg }]}>
                            <Text style={theme.sectionTitle}>How Gasless Works</Text>

                            <View style={theme.stepRow}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>1</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Build Transaction</Text>
                                    <Text style={theme.stepDescription}>
                                        Create USDC transfer instructions including automatic
                                        token account creation if needed.
                                    </Text>
                                </View>
                            </View>

                            <View style={theme.stepRow}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>2</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Paymaster Sponsorship</Text>
                                    <Text style={theme.stepDescription}>
                                        LazorKit's paymaster sponsors the fees - users never need
                                        SOL for gas.
                                    </Text>
                                </View>
                            </View>

                            <View style={[theme.stepRow, { marginBottom: 0 }]}>
                                <View style={theme.stepNumber}>
                                    <Text style={theme.stepNumberText}>3</Text>
                                </View>
                                <View style={theme.stepContent}>
                                    <Text style={theme.stepTitle}>Sign via Passkey</Text>
                                    <Text style={theme.stepDescription}>
                                        Sign with Face ID/Touch ID and the transaction is sent
                                        to Solana.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Code Example */}
                        <View style={[theme.codeCard, { marginTop: spacing.md }]}>
                            <Text style={[theme.sectionTitle, { padding: spacing.md, paddingBottom: 0 }]}>Code Example</Text>
                            <View style={theme.codeHighlight}>
                                <Text style={theme.codeHighlightText}>
                                    📱 Mobile: Include redirectUrl for deep link return
                                </Text>
                            </View>
                            <View style={theme.codeBlock}>
                                <Text style={theme.codeText}>
                                    {`import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { signAndSendTransaction } = useWallet();

const transferIx = createTransferInstruction(
  senderTokenAccount,
  recipientTokenAccount,
  senderPubkey,
  amount * 1_000_000,
);

// Send gasless with deep link redirect
const signature = await signAndSendTransaction(
  {
    instructions: [transferIx],
    transactionOptions: { computeUnitLimit: 200_000 },
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
