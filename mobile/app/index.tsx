import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footer } from '@/components/Footer';
import { colors, spacing, borderRadius, fontSize, commonStyles } from '@/lib/theme';

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
            >
                {/* Hero Section */}
                <View style={styles.hero}>
                    <Text style={styles.heroSubtitle}>
                        Real-world recipes showing how LazorKit makes Solana development simpler
                    </Text>
                    <Text style={styles.heroDescription}>
                        No more wallet adapters, no gas fee headaches.{'\n'}
                        Just connect with Face ID and build.
                    </Text>
                </View>

                {/* Recipe Cards */}
                <View style={styles.recipeList}>
                    {recipes.map((recipe) => (
                        <Link key={recipe.id} href={recipe.route as any} asChild>
                            <TouchableOpacity style={styles.recipeCard} activeOpacity={0.8}>
                                <Text style={styles.cardEmoji}>{recipe.emoji}</Text>

                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardNumber}>Recipe {recipe.id}</Text>
                                    <View style={styles.difficultyBadge}>
                                        <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                                    </View>
                                </View>

                                <Text style={styles.cardTitle}>{recipe.title}</Text>
                                <Text style={styles.cardDescription}>{recipe.description}</Text>

                                <Text style={styles.cardLink}>Start learning →</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },

    // Hero Section
    hero: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    heroSubtitle: {
        fontSize: fontSize.lg,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    heroDescription: {
        fontSize: fontSize.base,
        color: colors.text.muted,
        textAlign: 'center',
        lineHeight: 24,
    },

    // Recipe Cards
    recipeList: {
        gap: spacing.md,
    },
    recipeCard: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
    },
    cardEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    cardNumber: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    difficultyBadge: {
        backgroundColor: colors.status.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    difficultyText: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        color: colors.status.success,
    },
    cardTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    cardDescription: {
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    cardLink: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.accent.purple,
    },
});
