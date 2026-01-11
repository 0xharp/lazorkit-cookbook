/**
 * Shared styles for mobile recipe pages
 *
 * Extracted common patterns to reduce duplication and ensure consistency.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, commonStyles } from './theme';

/**
 * Common layout styles used across recipe pages
 */
export const layoutStyles = StyleSheet.create({
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
});

/**
 * Recipe page header styles
 */
export const headerStyles = StyleSheet.create({
    container: {
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
});

/**
 * Connect/CTA card styles (used when wallet not connected)
 */
export const connectCardStyles = StyleSheet.create({
    card: {
        ...commonStyles.glassCard,
        padding: spacing.xl,
        alignItems: 'center',
    },
    icon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: fontSize.base,
        color: colors.text.muted,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 24,
    },
    button: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        ...commonStyles.shadow,
    },
    buttonText: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
    },
});

/**
 * Balance card styles
 */
export const balanceCardStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.status.successBg,
        borderWidth: 1,
        borderColor: colors.status.successBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSize.sm,
        color: 'rgba(134, 239, 172, 0.8)',
    },
    refreshButton: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
    },
    value: {
        fontSize: fontSize['3xl'],
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    item: {
        alignItems: 'center',
    },
    itemLabel: {
        fontSize: fontSize.xs,
        color: 'rgba(134, 239, 172, 0.8)',
        marginBottom: spacing.xs,
    },
    itemValue: {
        fontSize: fontSize['2xl'],
        fontWeight: 'bold',
        color: colors.text.primary,
    },
});

/**
 * Form styles
 */
export const formStyles = StyleSheet.create({
    card: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
    },
    title: {
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
    inputLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    input: {
        ...commonStyles.input,
    },
    maxButton: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
        fontWeight: '600',
    },
    submitButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        ...commonStyles.shadow,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: fontSize.base,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
    },
});

/**
 * Info/tip card styles
 */
export const infoCardStyles = StyleSheet.create({
    warning: {
        backgroundColor: colors.status.warningBg,
        borderWidth: 1,
        borderColor: colors.status.warningBorder,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    warningTitle: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.status.warning,
        marginBottom: spacing.xs,
    },
    warningText: {
        fontSize: fontSize.sm,
        color: colors.status.warning,
        lineHeight: 20,
    },
    info: {
        backgroundColor: colors.status.infoBg,
        borderWidth: 1,
        borderColor: colors.status.infoBorder,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    infoText: {
        fontSize: fontSize.sm,
        color: colors.status.info,
    },
    gasless: {
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
});

/**
 * "How It Works" / Steps section styles
 */
export const stepsStyles = StyleSheet.create({
    card: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    title: {
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

/**
 * Code example styles
 */
export const codeStyles = StyleSheet.create({
    card: {
        ...commonStyles.glassCard,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    block: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
    },
    text: {
        fontSize: 11,
        color: colors.text.secondary,
        fontFamily: 'monospace',
        lineHeight: 18,
    },
});

/**
 * Transaction result styles
 */
export const txStyles = StyleSheet.create({
    card: {
        ...commonStyles.glassCard,
        padding: spacing.md,
    },
    label: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    signature: {
        fontSize: fontSize.xs,
        color: colors.accent.purple,
        fontFamily: 'monospace',
    },
});

/**
 * Action button styles
 */
export const actionButtonStyles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    outline: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.background.card,
    },
    text: {
        fontSize: fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
    },
    disconnect: {
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
});

/**
 * Swap interface styles (for Raydium)
 */
export const swapStyles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    tokenSection: {
        backgroundColor: colors.background.input,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    tokenLabel: {
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    tokenInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    tokenInput: {
        flex: 1,
        fontSize: fontSize['2xl'],
        fontWeight: '600',
        color: colors.text.primary,
        padding: 0,
    },
    tokenSelector: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    tokenButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: '#374151',
    },
    tokenButtonActive: {
        backgroundColor: colors.accent.purpleDark,
    },
    tokenButtonText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    outputValue: {
        flex: 1,
        fontSize: fontSize['2xl'],
        fontWeight: '600',
        color: colors.text.primary,
    },
    outputTokenBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.accent.purpleDark,
    },
    flipContainer: {
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    flipButton: {
        backgroundColor: colors.background.card,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    flipText: {
        fontSize: 24,
        color: colors.text.primary,
    },
    errorCard: {
        backgroundColor: colors.status.errorBg,
        borderWidth: 1,
        borderColor: colors.status.errorBorder,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginTop: spacing.sm,
    },
    errorText: {
        fontSize: fontSize.sm,
        color: colors.status.error,
    },
    poweredBy: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
