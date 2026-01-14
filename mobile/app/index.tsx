import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Footer } from '@/components/Footer';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { spacing, borderRadius, fontSize } from '@/lib/theme';

const recipes = [
    {
        id: '01',
        title: 'Passkey Wallet Basics',
        description: 'Create wallets with Face ID, check balances, and request airdrops',
        route: '/examples/01-connect-wallet',
        emoji: '👛',
        difficulty: 'Beginner',
    },
    {
        id: '02',
        title: 'Gasless USDC Transfer',
        description: 'Send USDC without paying gas fees using LazorKit paymaster',
        route: '/examples/02-gasless-transfer',
        emoji: '⚡',
        difficulty: 'Intermediate',
    },
    {
        id: '03',
        title: 'Gasless Raydium Token Swaps',
        description: 'Swap tokens on Raydium DEX without paying gas fees',
        route: '/examples/03-raydium-swap',
        emoji: '🔄',
        difficulty: 'Advanced',
    },
];

export default function HomeScreen() {
    const theme = useThemeStyles();
    const { colors } = theme;

    return (
        <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            style={theme.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <ScrollView
                style={theme.container}
                contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                    <Text style={[theme.textSecondary, { fontSize: fontSize.lg, textAlign: 'center', marginBottom: spacing.sm }]}>
                        Real-world recipes showing how LazorKit makes Solana development simpler
                    </Text>
                    <Text style={[theme.textMuted, { fontSize: fontSize.base, textAlign: 'center', lineHeight: 24 }]}>
                        No more wallet adapters, no gas fee headaches.{'\n'}
                        Just connect with Face ID and build.
                    </Text>
                </View>

                {/* Recipe Cards */}
                <View style={{ gap: spacing.md }}>
                    {recipes.map((recipe) => (
                        <Link key={recipe.id} href={recipe.route as any} asChild>
                            <TouchableOpacity style={theme.card} activeOpacity={0.8}>
                                <Text style={theme.emoji}>{recipe.emoji}</Text>

                                <View style={[theme.row, { marginBottom: spacing.sm }]}>
                                    <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text.primary }}>
                                        Recipe {recipe.id}
                                    </Text>
                                    <View style={{
                                        backgroundColor: colors.status.successBg,
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: spacing.xs,
                                        borderRadius: borderRadius.full,
                                    }}>
                                        <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.status.success }}>
                                            {recipe.difficulty}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm }}>
                                    {recipe.title}
                                </Text>
                                <Text style={{ fontSize: fontSize.sm, color: colors.text.muted, marginBottom: spacing.md, lineHeight: 20 }}>
                                    {recipe.description}
                                </Text>

                                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.accent.purple }}>
                                    Start learning →
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    ))}
                </View>
            </ScrollView>

            {/* Footer */}
            <Footer />
        </LinearGradient>
    );
}
