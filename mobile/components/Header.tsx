import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
    Linking,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { shortenAddress } from '@/lib/solana-utils';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';

export function Header() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === '/' || pathname === '';
    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();
    const [showDropdown, setShowDropdown] = useState(false);

    const { solBalance, usdcBalance, loading, fetchBalances, reset } = useBalances(
        isConnected ? wallet?.smartWallet : null
    );

    const handleConnect = () => {
        connect();
    };

    const handleDisconnect = () => {
        disconnect();
        setShowDropdown(false);
        reset();
    };

    const handleCopyAddress = async () => {
        if (wallet?.smartWallet) {
            await Clipboard.setStringAsync(wallet.smartWallet);
            Alert.alert('Copied', 'Address copied to clipboard');
        }
    };

    const handleViewExplorer = () => {
        if (wallet?.smartWallet) {
            Linking.openURL(
                `https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`
            );
            setShowDropdown(false);
        }
    };

    return (
        <View pointerEvents="box-none" style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            {/* Left - Back Button or Logo */}
            {isHomePage ? (
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => router.push('/')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoEmoji}>🧪</Text>
                    <View>
                        <Text style={styles.logoTitle}>LazorKit</Text>
                        <Text style={styles.logoSubtitle}>Cookbook</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Recipes</Text>
                </TouchableOpacity>
            )}

            {/* Center - Devnet Badge */}
            <View style={styles.devnetBadge}>
                <View style={styles.devnetDot} />
                <Text style={styles.devnetText}>Devnet</Text>
            </View>

            {/* Right - Wallet */}
            {isConnected && wallet ? (
                <TouchableOpacity
                    style={styles.walletButton}
                    onPress={() => setShowDropdown(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.connectedDot} />
                    <Text style={styles.walletAddress}>
                        {shortenAddress(wallet.smartWallet, 3)}
                    </Text>
                    <Text style={styles.chevron}>▼</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={handleConnect} disabled={connecting} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[colors.button.primary.start, colors.button.primary.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.connectButton}
                    >
                        <Text style={styles.connectButtonText}>
                            {connecting ? '...' : 'Connect'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Dropdown Modal */}
            <Modal
                visible={showDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <Pressable style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]} onPress={() => setShowDropdown(false)}>
                    <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
                        {/* Wallet Address */}
                        <View style={styles.dropdownSection}>
                            <Text style={styles.dropdownLabel}>Wallet Address</Text>
                            <TouchableOpacity
                                style={styles.addressRow}
                                onPress={handleCopyAddress}
                            >
                                <Text style={styles.addressText} numberOfLines={1}>
                                    {wallet?.smartWallet}
                                </Text>
                                <Text style={styles.copyIcon}>📋</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Balances */}
                        <View style={styles.dropdownSection}>
                            <View style={styles.balanceHeader}>
                                <Text style={styles.dropdownLabel}>Balances</Text>
                                <TouchableOpacity onPress={fetchBalances} disabled={loading}>
                                    <Text style={styles.refreshButton}>
                                        {loading ? '🔄 ...' : '🔄 Refresh'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceLabel}>SOL</Text>
                                <Text style={styles.balanceValue}>
                                    {solBalance !== null ? solBalance.toFixed(4) : '...'}
                                </Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceLabel}>USDC</Text>
                                <Text style={styles.balanceValue}>
                                    {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.dropdownActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleViewExplorer}
                            >
                                <Text style={styles.actionButtonText}>🔍 View on Explorer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.disconnectButton]}
                                onPress={handleDisconnect}
                            >
                                <Text style={styles.disconnectButtonText}>🔌 Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },

    // Logo
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    logoEmoji: {
        fontSize: 28,
    },
    logoTitle: {
        fontSize: fontSize.base,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    logoSubtitle: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
    },

    // Back Button
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingRight: spacing.sm,
    },
    backArrow: {
        fontSize: 24,
        color: colors.accent.purple,
        fontWeight: '300',
    },
    backText: {
        fontSize: fontSize.base,
        color: colors.accent.purple,
        fontWeight: '500',
    },

    // Devnet Badge
    devnetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: colors.status.successBg,
        borderWidth: 1,
        borderColor: colors.status.successBorder,
        borderRadius: borderRadius.full,
    },
    devnetDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.status.success,
    },
    devnetText: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        color: colors.status.success,
    },

    // Wallet Button
    walletButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: borderRadius.sm,
    },
    connectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.status.success,
    },
    walletAddress: {
        fontSize: fontSize.sm,
        fontFamily: 'monospace',
        color: colors.text.primary,
    },
    chevron: {
        fontSize: 10,
        color: colors.text.muted,
    },

    // Connect Button
    connectButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    connectButtonText: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.text.primary,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingRight: spacing.md,
    },
    dropdown: {
        width: 280,
        backgroundColor: '#1f2937',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.default,
        overflow: 'hidden',
    },

    // Dropdown Sections
    dropdownSection: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    dropdownLabel: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    addressText: {
        flex: 1,
        fontSize: fontSize.xs,
        fontFamily: 'monospace',
        color: colors.text.primary,
    },
    copyIcon: {
        fontSize: 16,
    },

    // Balances
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    refreshButton: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    balanceLabel: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    balanceValue: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.text.primary,
    },

    // Actions
    dropdownActions: {
        padding: spacing.sm,
        gap: spacing.sm,
    },
    actionButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: fontSize.sm,
        color: colors.text.primary,
    },
    disconnectButton: {
        backgroundColor: colors.status.errorBg,
    },
    disconnectButtonText: {
        fontSize: fontSize.sm,
        color: colors.status.error,
    },
});
