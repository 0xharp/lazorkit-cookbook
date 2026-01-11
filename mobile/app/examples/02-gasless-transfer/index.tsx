import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
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
import { colors, spacing, borderRadius, fontSize, commonStyles } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { Stack } from 'expo-router';

export default function GaslessTransferScreen() {
    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWallet();

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
        <Stack.Screen
            options={{
                title: 'Gasless USDC Transfer',
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
                        <Text style={styles.emoji}>⚡</Text>
                        <Text style={styles.title}>Gasless USDC Transfer</Text>
                        <Text style={styles.subtitle}>
                            Send USDC without paying gas fees - LazorKit's paymaster covers it
                        </Text>
                    </View>

                    {!isConnected ? (
                        /* Not Connected State */
                        <View style={styles.glassCard}>
                            <Text style={styles.lockIcon}>💸</Text>
                            <Text style={styles.connectTitle}>Connect to Start</Text>
                            <Text style={styles.connectDescription}>
                                Connect your wallet to send gasless USDC transfers
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
                        /* Transfer Form */
                        <View style={styles.formContainer}>
                            {/* Balance Card */}
                            <View style={styles.balanceCard}>
                                <View style={styles.balanceHeader}>
                                    <Text style={styles.balanceLabel}>Your USDC Balance</Text>
                                    <TouchableOpacity onPress={fetchBalance} disabled={refreshing}>
                                        <Text style={styles.refreshText}>
                                            {refreshing ? '⏳' : '🔄'} Refresh
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.balanceValue}>
                                    {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : '...'}
                                </Text>
                                {usdcBalance === 0 && (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL('https://faucet.circle.com/')}
                                    >
                                        <Text style={styles.faucetLink}>
                                            ⚠️ No USDC? Get some from Circle Faucet →
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Transfer Form Card */}
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Send USDC</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Recipient Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Solana address..."
                                        placeholderTextColor={colors.text.placeholder}
                                        value={recipient}
                                        onChangeText={setRecipient}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.amountLabelRow}>
                                        <Text style={styles.inputLabel}>Amount (USDC)</Text>
                                        {usdcBalance !== null && usdcBalance > 0 && (
                                            <TouchableOpacity onPress={handleUseMax}>
                                                <Text style={styles.maxButton}>
                                                    Use Max ({usdcBalance.toFixed(2)})
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <TextInput
                                        style={styles.input}
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
                                                : ['#374151', '#374151']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                                    >
                                        <Text style={styles.sendButtonText}>
                                            {sending
                                                ? retryCount > 0
                                                    ? `Retrying... (${retryCount}/3)`
                                                    : 'Sending...'
                                                : 'Send USDC (Gasless!)'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.gaslessInfo}>
                                    <Text style={styles.gaslessText}>
                                        ✨ 100% Gasless - LazorKit's paymaster covers all fees
                                    </Text>
                                </View>
                            </View>

                            {/* Last Transaction */}
                            {lastTxSignature && (
                                <TouchableOpacity
                                    style={styles.txCard}
                                    onPress={() => Linking.openURL(getExplorerUrl(lastTxSignature))}
                                >
                                    <Text style={styles.txLabel}>Last Transaction:</Text>
                                    <Text style={styles.txSignature}>
                                        {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-20)} ↗
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* How It Works */}
                    <View style={styles.howItWorksCard}>
                        <Text style={styles.sectionTitle}>How Gasless Works</Text>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Build Transaction</Text>
                                <Text style={styles.stepDescription}>
                                    Create USDC transfer instructions including automatic
                                    token account creation if needed.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Paymaster Sponsorship</Text>
                                <Text style={styles.stepDescription}>
                                    LazorKit's paymaster sponsors the fees - users never need
                                    SOL for gas.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>Sign via Passkey</Text>
                                <Text style={styles.stepDescription}>
                                    Sign with Face ID/Touch ID and the transaction is sent
                                    to Solana.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Code Example */}
                    <View style={styles.codeCard}>
                        <Text style={styles.sectionTitle}>Code Example</Text>
                        <View style={styles.mobileHighlight}>
                            <Text style={styles.mobileHighlightText}>
                                📱 Mobile: Include redirectUrl for deep link return
                            </Text>
                        </View>
                        <View style={styles.codeBlock}>
                            <Text style={styles.code}>
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
                        <View style={styles.cookbookNote}>
                            <Text style={styles.cookbookNoteText}>
                                💡 This cookbook's WalletContext wrapper handles redirect URLs
                                automatically. Check our mobile docs for the simplified API.
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
        marginBottom: spacing.lg,
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

    // Form
    formContainer: {
        gap: spacing.md,
    },
    balanceCard: {
        backgroundColor: colors.status.successBg,
        borderWidth: 1,
        borderColor: colors.status.successBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    balanceLabel: {
        fontSize: fontSize.sm,
        color: 'rgba(134, 239, 172, 0.8)',
    },
    refreshText: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
    },
    balanceValue: {
        fontSize: fontSize['3xl'],
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    faucetLink: {
        fontSize: fontSize.xs,
        color: colors.status.warning,
        marginTop: spacing.sm,
    },
    formCard: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
    },
    formTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    amountLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    maxButton: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
        fontWeight: '600',
    },
    input: {
        ...commonStyles.input,
    },
    sendButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        ...commonStyles.shadow,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: fontSize.base,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
    },
    gaslessInfo: {
        backgroundColor: colors.status.warningBg,
        borderWidth: 1,
        borderColor: colors.status.warningBorder,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginTop: spacing.md,
    },
    gaslessText: {
        fontSize: fontSize.sm,
        color: colors.status.warning,
        textAlign: 'center',
    },
    txCard: {
        ...commonStyles.glassCard,
        padding: spacing.md,
    },
    txLabel: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    txSignature: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
        fontFamily: 'monospace',
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
    mobileHighlight: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    mobileHighlightText: {
        fontSize: fontSize.sm,
        color: colors.accent.purple,
        textAlign: 'center',
        fontWeight: '600',
    },
    cookbookNote: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginTop: spacing.md,
    },
    cookbookNoteText: {
        fontSize: fontSize.xs,
        color: 'rgba(134, 239, 172, 0.9)',
        lineHeight: 18,
    },
});
