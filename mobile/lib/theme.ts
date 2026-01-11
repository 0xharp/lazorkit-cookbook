/**
 * Theme constants matching the web app design
 *
 * Web uses Tailwind classes, we translate them to React Native values
 */

export const colors = {
    // Background gradient colors (use with LinearGradient)
    gradient: {
        start: '#111827',      // gray-900
        middle: '#581c87',     // purple-900
        end: '#4c1d95',        // violet-900
    },

    // Solid backgrounds
    background: {
        primary: '#1a1a2e',    // Main dark background
        card: 'rgba(255, 255, 255, 0.05)',      // bg-white/5
        cardHover: 'rgba(255, 255, 255, 0.1)',  // bg-white/10
        input: 'rgba(0, 0, 0, 0.3)',            // bg-black/30
    },

    // Borders
    border: {
        default: 'rgba(255, 255, 255, 0.1)',    // border-white/10
        light: 'rgba(255, 255, 255, 0.2)',      // border-white/20
    },

    // Text colors
    text: {
        primary: '#ffffff',          // white
        secondary: '#d1d5db',        // gray-300
        muted: '#9ca3af',            // gray-400
        placeholder: '#6b7280',      // gray-500
    },

    // Accent colors
    accent: {
        purple: '#a78bfa',           // purple-400
        purpleLight: '#c4b5fd',      // purple-300
        purpleDark: '#8b5cf6',       // purple-500
    },

    // Status colors
    status: {
        success: '#4ade80',          // green-400
        successBg: 'rgba(34, 197, 94, 0.1)',    // green-500/10
        successBorder: 'rgba(34, 197, 94, 0.3)', // green-500/30

        warning: '#fef3c7',          // yellow-100
        warningBg: 'rgba(234, 179, 8, 0.1)',    // yellow-500/10
        warningBorder: 'rgba(234, 179, 8, 0.3)', // yellow-500/30

        error: '#fca5a5',            // red-300
        errorBg: 'rgba(239, 68, 68, 0.1)',      // red-500/10
        errorBorder: 'rgba(239, 68, 68, 0.3)',  // red-500/30

        info: '#93c5fd',             // blue-300
        infoBg: 'rgba(59, 130, 246, 0.1)',      // blue-500/10
        infoBorder: 'rgba(59, 130, 246, 0.3)',  // blue-500/30
    },

    // Button gradients
    button: {
        primary: {
            start: '#8b5cf6',        // purple-500
            end: '#ec4899',          // pink-500
        },
        success: {
            start: '#22c55e',        // green-500
            end: '#10b981',          // emerald-500
        },
    },
};

// Spacing and sizing
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

// Common styles
export const commonStyles = {
    // Glass card style
    glassCard: {
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: borderRadius.lg,
    },

    // Input field style
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

    // Shadow for elevated elements
    shadow: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
};
