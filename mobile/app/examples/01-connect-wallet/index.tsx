import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
import { useBalances } from '@/hooks/useBalances';
import { getConnection, shortenAddress } from '@/lib/solana-utils';
import { colors, spacing, borderRadius, fontSize, commonStyles } from '@/lib/theme';
import { Footer } from '@/components/Footer';

export default function ConnectWalletScreen() {
    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWallet();
    const { solBalance, usdcBalance, loading, fetchBalances } = useBalances(
        isConnected ? wallet?.smartWallet : null
    );

    const [airdropping, setAirdropping] = useState(false);

    const handleConnect = () => {
        connect('examples/01-connect-wallet');
    };

    const handleCopyAddress = async () => {
        if (!wallet?.smartWallet) return;
        await Clipboard.setStringAsync(wallet.smartWallet);
        Alert.alert('Copied', 'Wallet address copied to clipboard');
    };

    const handleAirdrop = async () => {
        if (!wallet?.smartWallet) return;

        setAirdropping(true);
        try {
            const connection = getConnection();
            const publicKey = new PublicKey(wallet.smartWallet);

            const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);

            Alert.alert('Success', 'Airdrop successful! You received 1 SOL');
            await fetchBalances();
        } catch (error) {
            console.error('Airdrop error:', error);
            Alert.alert(
                'Airdrop Failed',
                'Devnet faucets have rate limits. Try faucet.solana.com directly.'
            );
        } finally {
            setAirdropping(false);
        }
    };

    const handleViewExplorer = () => {
        if (!wallet?.smartWallet) return;
        Linking.openURL(
            `https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`
        );
    };

    const handleOpenFaucet = (type: 'sol' | 'usdc') => {
        const url = type === 'sol'
            ? 'https://faucet.solana.com/'
            : 'https://faucet.circle.com/';
        Linking.openURL(url);
    };

    return (
        <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    isConnected ? (
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchBalances}
                            tintColor={colors.accent.purple}
                        />
                    ) : undefined
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>👛</Text>
                    <Text style={styles.title}>Passkey Wallet Basics</Text>
                    <Text style={styles.subtitle}>
                        Create a wallet using passkey authentication with deep linking
                    </Text>
                </View>

                {!isConnected ? (
                    /* Not Connected State */
                    <View style={styles.connectContainer}>
                        <View style={styles.glassCard}>
                            <Text style={styles.lockIcon}>🔐</Text>
                            <Text style={styles.connectTitle}>Create Your Wallet</Text>
                            <Text style={styles.connectDescription}>
                                Tap the button below to create a wallet using Face ID or Touch ID.
                                No seed phrases needed!
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
                                        {connecting ? 'Creating Wallet...' : '🔑 Create Wallet with Passkey'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipText}>
                                💡 This will open the LazorKit portal for passkey authentication.
                                After signing, you'll be redirected back to this app.
                            </Text>
                        </View>
                    </View>
                ) : (
                    /* Connected State */
                    <View style={styles.connectedContainer}>
                        {/* Wallet Info Card */}
                        <View style={styles.walletCard}>
                            <View style={styles.statusRow}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Connected</Text>
                            </View>

                            <Text style={styles.addressLabel}>Wallet Address</Text>
                            <TouchableOpacity
                                onPress={handleCopyAddress}
                                style={styles.addressContainer}
                            >
                                <Text style={styles.address}>
                                    {shortenAddress(wallet?.smartWallet || '', 8)}
                                </Text>
                                <Text style={styles.copyHint}>Tap to copy full address</Text>
                            </TouchableOpacity>

                            {/* Balances */}
                            <View style={styles.balancesRow}>
                                <View style={styles.balanceItem}>
                                    <Text style={styles.balanceLabel}>SOL</Text>
                                    <Text style={styles.balanceValue}>
                                        {solBalance !== null ? solBalance.toFixed(4) : '...'}
                                    </Text>
                                </View>
                                <View style={styles.balanceItem}>
                                    <Text style={styles.balanceLabel}>USDC</Text>
                                    <Text style={styles.balanceValue}>
                                        {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsCard}>
                            <TouchableOpacity
                                onPress={handleAirdrop}
                                disabled={airdropping}
                                style={styles.actionButton}
                            >
                                <LinearGradient
                                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {airdropping ? '⏳ Requesting...' : '💧 Request 1 SOL Airdrop'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleOpenFaucet('usdc')}
                                style={styles.actionButton}
                            >
                                <LinearGradient
                                    colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Text style={styles.actionButtonText}>
                                        💵 Get USDC (Circle Faucet)
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleViewExplorer}
                                style={styles.actionButton}
                            >
                                <View style={styles.actionButtonOutline}>
                                    <Text style={styles.actionButtonText}>
                                        🔍 View on Explorer
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={disconnect}
                                style={styles.actionButton}
                            >
                                <View style={styles.disconnectButtonStyle}>
                                    <Text style={styles.disconnectText}>
                                        🔌 Disconnect
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Info */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                💡 Your wallet is secured by your device's biometrics.
                                No seed phrase needed!
                            </Text>
                        </View>
                    </View>
                )}

                {/* How It Works */}
                <View style={styles.howItWorksCard}>
                    <Text style={styles.sectionTitle}>How It Works</Text>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Passkey Authentication</Text>
                            <Text style={styles.stepDescription}>
                                LazorKit uses WebAuthn (Face ID/Touch ID) to secure your wallet.
                                Your private keys never leave your device.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Deep Link Redirect</Text>
                            <Text style={styles.stepDescription}>
                                On mobile, authentication happens via the LazorKit portal.
                                After signing, you're redirected back to the app.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Smart Wallet</Text>
                            <Text style={styles.stepDescription}>
                                A smart wallet address is created on Solana that can receive
                                tokens and interact with any program.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <Footer />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
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
    connectContainer: {
        gap: spacing.md,
    },
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
        lineHeight: 24,
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
        textAlign: 'center',
    },
    tipCard: {
        backgroundColor: colors.status.warningBg,
        borderWidth: 1,
        borderColor: colors.status.warningBorder,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    tipText: {
        fontSize: fontSize.sm,
        color: colors.status.warning,
        textAlign: 'center',
    },

    // Connected State
    connectedContainer: {
        gap: spacing.md,
    },
    walletCard: {
        backgroundColor: colors.status.successBg,
        borderWidth: 1,
        borderColor: colors.status.successBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.status.success,
        marginRight: spacing.sm,
    },
    statusText: {
        color: colors.status.success,
        fontSize: fontSize.base,
        fontWeight: '600',
    },
    addressLabel: {
        fontSize: fontSize.sm,
        color: 'rgba(134, 239, 172, 0.8)',
        marginBottom: spacing.xs,
    },
    addressContainer: {
        backgroundColor: 'rgba(10, 46, 26, 0.5)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    address: {
        fontSize: fontSize.base,
        color: colors.text.primary,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    copyHint: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
        textAlign: 'center',
        marginTop: spacing.xs,
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
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
        color: colors.text.primary,
    },

    // Actions
    actionsCard: {
        ...commonStyles.glassCard,
        padding: spacing.md,
        gap: spacing.sm,
    },
    actionButton: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonOutline: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.background.card,
    },
    actionButtonText: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
    },
    disconnectButtonStyle: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: colors.status.errorBg,
        borderWidth: 1,
        borderColor: colors.status.errorBorder,
    },
    disconnectText: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.status.error,
        textAlign: 'center',
    },

    // Info
    infoCard: {
        backgroundColor: colors.status.warningBg,
        borderWidth: 1,
        borderColor: colors.status.warningBorder,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    infoText: {
        fontSize: fontSize.sm,
        color: colors.status.warning,
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
});
