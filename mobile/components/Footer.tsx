import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '@/lib/theme';

export function Footer() {
    const insets = useSafeAreaInsets();

    const handleOpenLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.row}>
                {/* Built with */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        Built using{' '}
                        <Text
                            style={styles.link}
                            onPress={() => handleOpenLink('https://lazorkit.com/')}
                        >
                            LazorKit SDK
                        </Text>
                        {' | '}
                        <Text
                            style={styles.link}
                            onPress={() => handleOpenLink('https://docs.lazorkit.com/')}
                        >
                            Docs
                        </Text>
                    </Text>
                </View>

                {/* Bounty */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        For{' '}
                        <Text
                            style={styles.link}
                            onPress={() => handleOpenLink('https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux')}
                        >
                            Superteam Bounty
                        </Text>
                    </Text>
                </View>

                {/* Built by */}
                <View style={styles.section}>
                    <Text style={styles.text}>
                        By{' '}
                        <Text
                            style={styles.link}
                            onPress={() => handleOpenLink('https://x.com/0xharp')}
                        >
                            0xharp
                        </Text>
                        {' | '}
                        <Text
                            style={styles.link}
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

const styles = StyleSheet.create({
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        paddingTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    row: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    section: {
        alignItems: 'center',
    },
    text: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    link: {
        color: colors.accent.purple,
        fontWeight: '600',
    },
});
