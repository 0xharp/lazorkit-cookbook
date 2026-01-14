import { View, Text, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize } from '@/lib/theme';

export function Footer() {
    const insets = useSafeAreaInsets();
    const { colors, isLazorkit } = useTheme();

    const handleOpenLink = (url: string) => {
        Linking.openURL(url);
    };

    const footerBg = isLazorkit ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 24, 39, 0.95)';

    return (
        <View style={{
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
            backgroundColor: footerBg,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.md),
        }}>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
                {/* Built with */}
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center' }}>
                        Built using{' '}
                        <Text
                            style={{ color: colors.accent.purple, fontWeight: '600' }}
                            onPress={() => handleOpenLink('https://lazorkit.com/')}
                        >
                            LazorKit SDK
                        </Text>
                        {' | '}
                        <Text
                            style={{ color: colors.accent.purple, fontWeight: '600' }}
                            onPress={() => handleOpenLink('https://docs.lazorkit.com/')}
                        >
                            Docs
                        </Text>
                    </Text>
                </View>

                {/* Bounty */}
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center' }}>
                        For{' '}
                        <Text
                            style={{ color: colors.accent.purple, fontWeight: '600' }}
                            onPress={() => handleOpenLink('https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux')}
                        >
                            Superteam Bounty
                        </Text>
                    </Text>
                </View>

                {/* Built by */}
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center' }}>
                        By{' '}
                        <Text
                            style={{ color: colors.accent.purple, fontWeight: '600' }}
                            onPress={() => handleOpenLink('https://x.com/0xharp')}
                        >
                            0xharp
                        </Text>
                        {' | '}
                        <Text
                            style={{ color: colors.accent.purple, fontWeight: '600' }}
                            onPress={() => handleOpenLink('https://github.com/0xharp/lazorkit-cookbook')}
                        >
                            GitHub
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}
