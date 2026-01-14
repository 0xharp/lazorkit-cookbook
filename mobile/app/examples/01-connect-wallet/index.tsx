import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { getConnection, shortenAddress } from '@/lib/solana-utils';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { spacing, borderRadius, fontSize } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { Stack } from 'expo-router';

export default function ConnectWalletScreen() {
    const theme = useThemeStyles();
    const { colors } = theme;

    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();
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
        <>
            <Stack.Screen options={{ title: 'Connect Wallet' }} />
            <LinearGradient
                colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                style={theme.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView
                    style={theme.container}
                    contentContainerStyle={theme.scrollContent}
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
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={theme.emoji}>👛</Text>
                        <Text style={theme.title}>Passkey Wallet Basics</Text>
                        <Text style={theme.subtitle}>
                            Create a wallet using passkey authentication with deep linking
                        </Text>
                    </View>

                    {!isConnected ? (
                        /* Not Connected State */
                        <View style={theme.section}>
                            <View style={[theme.card, { alignItems: 'center' }]}>
                                <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>🔐</Text>
                                <Text style={[theme.sectionTitle, { textAlign: 'center' }]}>Create Your Wallet</Text>
                                <Text style={[theme.textMuted, { textAlign: 'center', marginBottom: spacing.lg }]}>
                                    Tap the button below to create a wallet using Face ID or Touch ID.
                                    No seed phrases needed!
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
                                            {connecting ? 'Creating Wallet...' : '🔑 Create Wallet with Passkey'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <View style={theme.cardWarning}>
                                <Text style={theme.textWarning}>
                                    💡 This will open the LazorKit portal for passkey authentication.
                                    After signing, you'll be redirected back to this app.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        /* Connected State */
                        <View style={theme.section}>
                            {/* Wallet Info Card */}
                            <View style={theme.cardSuccess}>
                                <View style={[theme.row, { marginBottom: spacing.md }]}>
                                    <View style={theme.statusDot} />
                                    <Text style={theme.textSuccess}>Connected</Text>
                                </View>

                                <Text style={[theme.textMuted, { marginBottom: spacing.xs }]}>Wallet Address</Text>
                                <TouchableOpacity
                                    onPress={handleCopyAddress}
                                    style={[theme.input, theme.rowBetween, { marginBottom: spacing.lg }]}
                                >
                                    <Text style={theme.mono}>
                                        {shortenAddress(wallet?.smartWallet || '', 8)}
                                    </Text>
                                    <Text style={theme.textAccent}>Tap to copy</Text>
                                </TouchableOpacity>

                                {/* Balances */}
                                <View style={theme.balanceRow}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={theme.balanceLabel}>SOL</Text>
                                        <Text style={theme.balanceValue}>
                                            {solBalance !== null ? solBalance.toFixed(4) : '...'}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={theme.balanceLabel}>USDC</Text>
                                        <Text style={theme.balanceValue}>
                                            {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={[theme.card, { gap: spacing.sm }]}>
                                <TouchableOpacity
                                    onPress={handleAirdrop}
                                    disabled={airdropping}
                                    style={{ borderRadius: borderRadius.md, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={[colors.status.infoBg, 'rgba(59, 130, 246, 0.05)']}
                                        style={[theme.btnOutline, { borderColor: colors.status.infoBorder }]}
                                    >
                                        <Text style={theme.btnOutlineText}>
                                            {airdropping ? '⏳ Requesting...' : '💧 Request 1 SOL Airdrop'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleOpenFaucet('usdc')}
                                    style={{ borderRadius: borderRadius.md, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={[colors.status.successBg, 'rgba(34, 197, 94, 0.05)']}
                                        style={[theme.btnOutline, { borderColor: colors.status.successBorder }]}
                                    >
                                        <Text style={theme.btnOutlineText}>💵 Get USDC (Circle Faucet)</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleViewExplorer}>
                                    <View style={theme.btnOutline}>
                                        <Text style={theme.btnOutlineText}>🔍 View on Explorer</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={disconnect}>
                                    <View style={theme.btnDanger}>
                                        <Text style={theme.btnDangerText}>🔌 Disconnect</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Info */}
                            <View style={theme.cardWarning}>
                                <Text style={theme.textWarning}>
                                    💡 Your wallet is secured by your device's biometrics.
                                    No seed phrase needed!
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* How It Works */}
                    <View style={[theme.card, { marginTop: spacing.lg }]}>
                        <Text style={theme.sectionTitle}>How It Works</Text>

                        <View style={theme.stepRow}>
                            <View style={theme.stepNumber}>
                                <Text style={theme.stepNumberText}>1</Text>
                            </View>
                            <View style={theme.stepContent}>
                                <Text style={theme.stepTitle}>Passkey Authentication</Text>
                                <Text style={theme.stepDescription}>
                                    LazorKit uses WebAuthn (Face ID/Touch ID) to secure your wallet.
                                    Your private keys never leave your device.
                                </Text>
                            </View>
                        </View>

                        <View style={theme.stepRow}>
                            <View style={theme.stepNumber}>
                                <Text style={theme.stepNumberText}>2</Text>
                            </View>
                            <View style={theme.stepContent}>
                                <Text style={theme.stepTitle}>Deep Link Redirect</Text>
                                <Text style={theme.stepDescription}>
                                    On mobile, authentication happens via the LazorKit portal.
                                    After signing, you're redirected back to the app.
                                </Text>
                            </View>
                        </View>

                        <View style={[theme.stepRow, { marginBottom: 0 }]}>
                            <View style={theme.stepNumber}>
                                <Text style={theme.stepNumberText}>3</Text>
                            </View>
                            <View style={theme.stepContent}>
                                <Text style={theme.stepTitle}>Smart Wallet</Text>
                                <Text style={theme.stepDescription}>
                                    A smart wallet address is created on Solana that can receive
                                    tokens and interact with any program.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Code Example */}
                    <View style={[theme.codeCard, { marginTop: spacing.md }]}>
                        <Text style={[theme.sectionTitle, { padding: spacing.md, paddingBottom: 0 }]}>Code Example</Text>
                        <View style={theme.codeHighlight}>
                            <Text style={theme.codeHighlightText}>
                                📱 Mobile: Uses deep linking for redirect
                            </Text>
                        </View>
                        <View style={theme.codeBlock}>
                            <Text style={theme.codeText}>
                                {`import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { wallet, isConnected, connect } = useWallet();

// Connect with deep link redirect
await connect({
  redirectUrl: Linking.createURL('your/return/path'),
  onSuccess: (connectedWallet) => {
    console.log('Connected:', connectedWallet.smartWallet);
  },
  onFail: (error) => {
    console.error('Failed:', error.message);
  },
});

// Access wallet address
if (isConnected && wallet) {
  console.log(wallet.smartWallet);
}`}
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

                {/* Footer */}
                <Footer />
            </LinearGradient>
        </>
    );
}
