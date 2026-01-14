import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    Linking,
    Alert,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { shortenAddress } from '@/lib/solana-utils';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '@/lib/theme';

// Import logo images
const LogoDark = require('@/assets/LazorKitLogoDark.png');
const LogoLight = require('@/assets/LazorKitLogoLight.png');

export function Header() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === '/' || pathname === '';

    const { colors, isLazorkit, toggleTheme } = useTheme();
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

    // Dynamic styles based on theme
    const headerBg = isLazorkit ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 24, 39, 0.9)';
    const dropdownBg = isLazorkit ? '#ffffff' : '#1f2937';
    // LazorKit brand colors for text
    const logoTextColor = isLazorkit ? '#1f2937' : '#ffffff';
    const subtitleColor = isLazorkit ? '#6b7280' : '#9ca3af';

    return (
        <View
            pointerEvents="box-none"
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                paddingTop: insets.top + spacing.sm,
                backgroundColor: headerBg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.default,
            }}
        >
            {/* Left - Back Button or Logo */}
            {isHomePage ? (
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                    onPress={() => router.push('/')}
                    activeOpacity={0.8}
                >
                    <Image
                        source={isLazorkit ? LogoLight : LogoDark}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                        fadeDuration={0}
                    />
                    <View>
                        <Text style={{ fontSize: fontSize.base, fontWeight: 'bold', color: colors.accent.purple }}>
                            LazorKit
                        </Text>
                        <Text style={{ fontSize: fontSize.xs, color: logoTextColor }}>
                            Cookbook
                        </Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        paddingVertical: spacing.xs,
                        paddingRight: spacing.sm,
                    }}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Text style={{ fontSize: 24, color: colors.accent.purple, fontWeight: '300' }}>←</Text>
                    <Text style={{ fontSize: fontSize.base, color: colors.accent.purple, fontWeight: '500' }}>
                        Recipes
                    </Text>
                </TouchableOpacity>
            )}

            {/* Center - Devnet Badge + Theme Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    backgroundColor: colors.status.successBg,
                    borderWidth: 1,
                    borderColor: colors.status.successBorder,
                    borderRadius: borderRadius.full,
                }}>
                    <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.status.success,
                    }} />
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.status.success }}>
                        Devnet
                    </Text>
                </View>

                {/* Theme Toggle Button */}
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isLazorkit ? '#f3f4f6' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: borderRadius.md,
                    }}
                >
                    <Text style={{ fontSize: 18 }}>{isLazorkit ? '🌙' : '☀️'}</Text>
                </TouchableOpacity>
            </View>

            {/* Right - Wallet */}
            {isConnected && wallet ? (
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.sm,
                        backgroundColor: colors.background.card,
                        borderWidth: 1,
                        borderColor: colors.border.default,
                        borderRadius: borderRadius.sm,
                    }}
                    onPress={() => setShowDropdown(true)}
                    activeOpacity={0.8}
                >
                    <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.status.success,
                    }} />
                    <Text style={{ fontSize: fontSize.sm, fontFamily: 'monospace', color: colors.text.primary }}>
                        {shortenAddress(wallet.smartWallet, 3)}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.text.muted }}>▼</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={handleConnect} disabled={connecting} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[colors.button.primary.start, colors.button.primary.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: borderRadius.sm,
                        }}
                    >
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: '#ffffff' }}>
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
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-end',
                        paddingRight: spacing.md,
                        paddingTop: insets.top + 60,
                    }}
                    onPress={() => setShowDropdown(false)}
                >
                    <Pressable
                        style={{
                            width: 280,
                            backgroundColor: dropdownBg,
                            borderRadius: borderRadius.lg,
                            borderWidth: 1,
                            borderColor: colors.border.default,
                            overflow: 'hidden',
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Wallet Address */}
                        <View style={{
                            padding: spacing.md,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border.default,
                        }}>
                            <Text style={{ fontSize: fontSize.xs, color: colors.text.muted, marginBottom: spacing.xs }}>
                                Wallet Address
                            </Text>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                                onPress={handleCopyAddress}
                            >
                                <Text
                                    style={{ flex: 1, fontSize: fontSize.xs, fontFamily: 'monospace', color: colors.text.primary }}
                                    numberOfLines={1}
                                >
                                    {wallet?.smartWallet}
                                </Text>
                                <Text style={{ fontSize: 16 }}>📋</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Balances */}
                        <View style={{
                            padding: spacing.md,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border.default,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: spacing.sm,
                            }}>
                                <Text style={{ fontSize: fontSize.xs, color: colors.text.muted }}>
                                    Balances
                                </Text>
                                <TouchableOpacity onPress={fetchBalances} disabled={loading}>
                                    <Text style={{ fontSize: fontSize.xs, color: colors.accent.purple }}>
                                        {loading ? '🔄 ...' : '🔄 Refresh'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: spacing.xs,
                            }}>
                                <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary }}>SOL</Text>
                                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text.primary }}>
                                    {solBalance !== null ? solBalance.toFixed(4) : '...'}
                                </Text>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary }}>USDC</Text>
                                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text.primary }}>
                                    {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={{ padding: spacing.sm, gap: spacing.sm }}>
                            <TouchableOpacity
                                style={{
                                    paddingVertical: spacing.sm,
                                    paddingHorizontal: spacing.md,
                                    backgroundColor: isLazorkit ? '#f3f4f6' : colors.background.card,
                                    borderWidth: 1,
                                    borderColor: colors.border.default,
                                    borderRadius: borderRadius.sm,
                                    alignItems: 'center',
                                }}
                                onPress={handleViewExplorer}
                            >
                                <Text style={{ fontSize: fontSize.sm, color: colors.text.primary }}>
                                    🔍 View on Explorer
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    paddingVertical: spacing.sm,
                                    paddingHorizontal: spacing.md,
                                    backgroundColor: colors.status.errorBg,
                                    borderRadius: borderRadius.sm,
                                    alignItems: 'center',
                                }}
                                onPress={handleDisconnect}
                            >
                                <Text style={{ fontSize: fontSize.sm, color: colors.status.error }}>
                                    🔌 Disconnect
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
