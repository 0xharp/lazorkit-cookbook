/**
 * Theme system for React Native
 * Supports two themes: 'dark' (original) and 'lazorkit' (light)
 * Colors aligned with web/lib/theme.ts
 */

import { ViewStyle, TextStyle } from 'react-native';

// ============================================================================
// Spacing and sizing (shared across themes)
// ============================================================================

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
};

// ============================================================================
// Color Palettes
// ============================================================================

export interface ThemeColors {
    gradient: {
        start: string;
        middle: string;
        end: string;
    };
    background: {
        primary: string;
        card: string;
        cardHover: string;
        input: string;
    };
    border: {
        default: string;
        light: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
        placeholder: string;
    };
    accent: {
        purple: string;
        purpleLight: string;
        purpleDark: string;
    };
    status: {
        success: string;
        successBg: string;
        successBorder: string;
        warning: string;
        warningBg: string;
        warningBorder: string;
        error: string;
        errorBg: string;
        errorBorder: string;
        info: string;
        infoBg: string;
        infoBorder: string;
    };
    button: {
        primary: {
            start: string;
            end: string;
        };
        success: {
            start: string;
            end: string;
        };
        disabled: string;
    };
}

// Dark theme (original purple gradient)
export const darkColors: ThemeColors = {
    gradient: {
        start: '#111827',      // gray-900
        middle: '#581c87',     // purple-900
        end: '#4c1d95',        // violet-900
    },
    background: {
        primary: '#1a1a2e',
        card: 'rgba(255, 255, 255, 0.05)',      // bg-white/5
        cardHover: 'rgba(255, 255, 255, 0.1)',  // bg-white/10
        input: 'rgba(0, 0, 0, 0.3)',
    },
    border: {
        default: 'rgba(255, 255, 255, 0.1)',    // border-white/10
        light: 'rgba(255, 255, 255, 0.2)',      // border-white/20
    },
    text: {
        primary: '#ffffff',
        secondary: '#d1d5db',        // gray-300
        muted: '#9ca3af',            // gray-400
        placeholder: '#6b7280',      // gray-500
    },
    accent: {
        purple: '#a78bfa',           // purple-400
        purpleLight: '#c4b5fd',      // purple-300
        purpleDark: '#8b5cf6',       // purple-500
    },
    status: {
        success: '#4ade80',          // green-400
        successBg: 'rgba(34, 197, 94, 0.1)',
        successBorder: 'rgba(34, 197, 94, 0.3)',
        warning: '#fef3c7',          // yellow-100
        warningBg: 'rgba(234, 179, 8, 0.1)',
        warningBorder: 'rgba(234, 179, 8, 0.3)',
        error: '#fca5a5',            // red-300
        errorBg: 'rgba(239, 68, 68, 0.1)',
        errorBorder: 'rgba(239, 68, 68, 0.3)',
        info: '#93c5fd',             // blue-300
        infoBg: 'rgba(59, 130, 246, 0.1)',
        infoBorder: 'rgba(59, 130, 246, 0.3)',
    },
    button: {
        primary: {
            start: '#8b5cf6',        // purple-500
            end: '#ec4899',          // pink-500
        },
        success: {
            start: '#22c55e',        // green-500
            end: '#10b981',          // emerald-500
        },
        disabled: '#374151',         // gray-700
    },
};

// LazorKit light theme (matching web)
export const lazorkitColors: ThemeColors = {
    gradient: {
        start: '#ffffff',
        middle: '#f9fafb',           // gray-50
        end: '#f3f4f6',              // gray-100
    },
    background: {
        primary: '#ffffff',
        card: '#ffffff',
        cardHover: '#f9fafb',
        input: '#f3f4f6',            // gray-100
    },
    border: {
        default: '#e5e7eb',          // gray-200
        light: '#d1d5db',            // gray-300
    },
    text: {
        primary: '#1f2937',          // gray-800
        secondary: '#4b5563',        // gray-600
        muted: '#6b7280',            // gray-500
        placeholder: '#9ca3af',      // gray-400
    },
    accent: {
        purple: '#7857FF',           // LazorKit brand purple
        purpleLight: '#a855f7',      // purple-500
        purpleDark: '#6d28d9',       // violet-700
    },
    status: {
        success: '#15803d',          // green-700 (darker for visibility)
        successBg: 'rgba(34, 197, 94, 0.15)',
        successBorder: 'rgba(34, 197, 94, 0.4)',
        warning: '#b45309',          // amber-700 (darker for visibility)
        warningBg: 'rgba(245, 158, 11, 0.15)',
        warningBorder: 'rgba(245, 158, 11, 0.4)',
        error: '#b91c1c',            // red-700 (darker for visibility)
        errorBg: 'rgba(239, 68, 68, 0.15)',
        errorBorder: 'rgba(239, 68, 68, 0.4)',
        info: '#1d4ed8',             // blue-700 (darker for visibility)
        infoBg: 'rgba(59, 130, 246, 0.15)',
        infoBorder: 'rgba(59, 130, 246, 0.4)',
    },
    button: {
        primary: {
            start: '#7857FF',        // LazorKit brand
            end: '#a855f7',          // purple-500
        },
        success: {
            start: '#22c55e',
            end: '#10b981',
        },
        disabled: '#d1d5db',         // gray-300
    },
};

// ============================================================================
// Theme Styles Interface
// ============================================================================

export interface ThemeStyles {
    // Layout
    container: ViewStyle;
    scrollContent: ViewStyle;
    section: ViewStyle;

    // Cards
    card: ViewStyle;
    cardSuccess: ViewStyle;
    cardWarning: ViewStyle;
    cardError: ViewStyle;
    cardInfo: ViewStyle;

    // Typography
    emoji: TextStyle;
    title: TextStyle;
    subtitle: TextStyle;
    sectionTitle: TextStyle;
    textPrimary: TextStyle;
    textSecondary: TextStyle;
    textMuted: TextStyle;
    textSuccess: TextStyle;
    textWarning: TextStyle;
    textError: TextStyle;
    textAccent: TextStyle;
    link: TextStyle;
    mono: TextStyle;

    // Inputs
    input: ViewStyle & TextStyle;
    inputLabel: TextStyle;

    // Buttons
    btnPrimary: ViewStyle;
    btnPrimaryText: TextStyle;
    btnSuccess: ViewStyle;
    btnSuccessText: TextStyle;
    btnDisabled: ViewStyle;
    btnDisabledText: TextStyle;
    btnOutline: ViewStyle;
    btnOutlineText: TextStyle;
    btnDanger: ViewStyle;
    btnDangerText: TextStyle;

    // Steps (How It Works)
    stepRow: ViewStyle;
    stepNumber: ViewStyle;
    stepNumberText: TextStyle;
    stepContent: ViewStyle;
    stepTitle: TextStyle;
    stepDescription: TextStyle;

    // Code blocks
    codeCard: ViewStyle;
    codeHighlight: ViewStyle;
    codeHighlightText: TextStyle;
    codeBlock: ViewStyle;
    codeText: TextStyle;
    codeNote: ViewStyle;
    codeNoteText: TextStyle;

    // Swap-specific
    tokenSection: ViewStyle;
    tokenLabel: TextStyle;
    tokenInputRow: ViewStyle;
    tokenInput: TextStyle;
    tokenButton: ViewStyle;
    tokenButtonActive: ViewStyle;
    tokenButtonText: TextStyle;
    tokenButtonTextActive: TextStyle;
    flipButton: ViewStyle;
    flipText: TextStyle;
    outputValue: TextStyle;
    outputBadge: ViewStyle;

    // Balance display
    balanceCard: ViewStyle;
    balanceLabel: TextStyle;
    balanceValue: TextStyle;
    balanceRow: ViewStyle;

    // Utilities
    row: ViewStyle;
    rowBetween: ViewStyle;
    center: ViewStyle;
    statusDot: ViewStyle;
    refreshText: TextStyle;
}

// ============================================================================
// Theme Styles Factory
// ============================================================================

export function createThemeStyles(colors: ThemeColors): ThemeStyles {
    return {
        // Layout
        container: {
            flex: 1,
        },
        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
        },
        section: {
            gap: spacing.md,
        },

        // Cards
        card: {
            backgroundColor: colors.background.card,
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
        },
        cardSuccess: {
            backgroundColor: colors.status.successBg,
            borderWidth: 1,
            borderColor: colors.status.successBorder,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
        },
        cardWarning: {
            backgroundColor: colors.status.warningBg,
            borderWidth: 1,
            borderColor: colors.status.warningBorder,
            borderRadius: borderRadius.md,
            padding: spacing.md,
        },
        cardError: {
            backgroundColor: colors.status.errorBg,
            borderWidth: 1,
            borderColor: colors.status.errorBorder,
            borderRadius: borderRadius.md,
            padding: spacing.md,
        },
        cardInfo: {
            backgroundColor: colors.status.infoBg,
            borderWidth: 1,
            borderColor: colors.status.infoBorder,
            borderRadius: borderRadius.md,
            padding: spacing.md,
        },

        // Typography
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
        sectionTitle: {
            fontSize: fontSize.lg,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: spacing.md,
        },
        textPrimary: {
            color: colors.text.primary,
        },
        textSecondary: {
            color: colors.text.secondary,
        },
        textMuted: {
            color: colors.text.muted,
        },
        textSuccess: {
            color: colors.status.success,
        },
        textWarning: {
            color: colors.status.warning,
        },
        textError: {
            color: colors.status.error,
        },
        textAccent: {
            color: colors.accent.purple,
        },
        link: {
            color: colors.accent.purple,
            textDecorationLine: 'underline',
        },
        mono: {
            fontFamily: 'monospace',
            color: colors.text.primary,
        },

        // Inputs
        input: {
            backgroundColor: colors.background.input,
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 14,
            fontSize: fontSize.base,
            color: colors.text.primary,
        },
        inputLabel: {
            fontSize: fontSize.sm,
            color: colors.text.muted,
            marginBottom: spacing.xs,
        },

        // Buttons
        btnPrimary: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        btnPrimaryText: {
            fontSize: fontSize.base,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center',
        },
        btnSuccess: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        btnSuccessText: {
            fontSize: fontSize.base,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
        },
        btnDisabled: {
            opacity: 1,
        },
        btnDisabledText: {
            fontSize: fontSize.base,
            fontWeight: 'bold',
            color: colors.text.muted,
            textAlign: 'center',
        },
        btnOutline: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border.default,
            backgroundColor: colors.background.card,
            alignItems: 'center',
        },
        btnOutlineText: {
            fontSize: fontSize.base,
            fontWeight: '600',
            color: colors.text.primary,
            textAlign: 'center',
        },
        btnDanger: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            backgroundColor: colors.status.errorBg,
            borderWidth: 1,
            borderColor: colors.status.errorBorder,
            alignItems: 'center',
        },
        btnDangerText: {
            fontSize: fontSize.base,
            fontWeight: '600',
            color: colors.status.error,
            textAlign: 'center',
        },

        // Steps
        stepRow: {
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
            color: '#ffffff',
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

        // Code blocks
        codeCard: {
            backgroundColor: colors.background.card,
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
        },
        codeHighlight: {
            backgroundColor: colors.status.infoBg,
            borderWidth: 1,
            borderColor: colors.status.infoBorder,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            marginHorizontal: spacing.md,
            marginTop: spacing.sm,
            marginBottom: spacing.md,
        },
        codeHighlightText: {
            fontSize: fontSize.sm,
            color: colors.status.info,
            textAlign: 'center',
            fontWeight: '600',
        },
        codeBlock: {
            backgroundColor: colors.background.input,
            padding: spacing.md,
        },
        codeText: {
            fontSize: 11,
            color: colors.text.primary,
            fontFamily: 'monospace',
            lineHeight: 18,
        },
        codeNote: {
            backgroundColor: colors.status.successBg,
            borderTopWidth: 1,
            borderTopColor: colors.status.successBorder,
            padding: spacing.md,
        },
        codeNoteText: {
            fontSize: fontSize.xs,
            color: colors.status.success,
            lineHeight: 18,
        },

        // Swap-specific
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
        tokenButton: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.background.input,
            borderWidth: 1,
            borderColor: colors.border.default,
        },
        tokenButtonActive: {
            backgroundColor: colors.accent.purple,
            borderColor: colors.accent.purple,
        },
        tokenButtonText: {
            color: colors.text.secondary,
            fontWeight: '600',
            fontSize: fontSize.sm,
        },
        tokenButtonTextActive: {
            color: '#ffffff',
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
        },
        outputValue: {
            flex: 1,
            fontSize: fontSize['2xl'],
            fontWeight: '600',
            color: colors.text.primary,
        },
        outputBadge: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.accent.purpleDark,
        },

        // Balance display
        balanceCard: {
            backgroundColor: colors.status.successBg,
            borderWidth: 1,
            borderColor: colors.status.successBorder,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
        },
        balanceLabel: {
            fontSize: fontSize.xs,
            color: colors.status.success,
            marginBottom: spacing.xs,
        },
        balanceValue: {
            fontSize: fontSize['2xl'],
            fontWeight: 'bold',
            color: colors.text.primary,
        },
        balanceRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
        },

        // Utilities
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        rowBetween: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        center: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        statusDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.status.success,
            marginRight: spacing.sm,
        },
        refreshText: {
            fontSize: fontSize.xs,
            color: colors.accent.purple,
        },
    };
}

// Legacy export for backwards compatibility during migration
export const colors = darkColors;
