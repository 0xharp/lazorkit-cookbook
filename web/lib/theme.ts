/**
 * Theme utilities for the web application.
 * These provide reusable class name mappings that automatically
 * switch between dark and LazorKit (light) themes.
 */

export interface ThemeClasses {
    // Backgrounds
    bgPage: string;
    bgCard: string;
    bgCardHover: string;
    bgCardAlt: string;
    bgInput: string;
    bgCta: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textAccent: string;

    // Borders
    border: string;
    borderSubtle: string;
    borderAccent: string;

    // Buttons
    btnPrimary: string;
    btnSecondary: string;
    btnDanger: string;

    // Status
    statusSuccess: string;
    statusWarning: string;
    statusError: string;

    // Info boxes (for semantic colored sections)
    infoBlue: string;
    infoBlueTitle: string;
    infoBlueText: string;
    infoPurple: string;
    infoPurpleTitle: string;
    infoPurpleText: string;
    infoYellow: string;
    infoYellowTitle: string;
    infoYellowText: string;

    // Special
    glass: string;
    codeBlock: string;
}

/**
 * Get theme-aware class names based on current theme
 */
export function getThemeClasses(isLazorkit: boolean): ThemeClasses {
    return {
        // Backgrounds
        bgPage: isLazorkit
            ? 'bg-white'
            : 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900',
        bgCard: isLazorkit
            ? 'bg-white border border-gray-200 shadow-sm'
            : 'bg-white/5 backdrop-blur-lg border border-white/10',
        bgCardHover: isLazorkit
            ? 'hover:shadow-md hover:scale-[1.01]'
            : 'hover:bg-white/10',
        bgCardAlt: isLazorkit
            ? 'bg-gray-50 border border-gray-100'
            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30',
        bgInput: isLazorkit
            ? 'bg-gray-50 border border-gray-200 focus:border-[#7857FF] focus:ring-1 focus:ring-[#7857FF]'
            : 'bg-white/5 border border-white/10',
        bgCta: isLazorkit
            ? 'bg-gradient-to-r from-[#F5F3FF] to-[#F8F7FF] border border-[#ECE9FF]'
            : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30',

        // Text
        textPrimary: isLazorkit ? 'text-gray-900' : 'text-white',
        textSecondary: isLazorkit ? 'text-gray-700' : 'text-gray-300',
        textMuted: isLazorkit ? 'text-gray-500' : 'text-gray-400',
        textAccent: isLazorkit ? 'text-[#7857FF]' : 'text-purple-400',

        // Borders
        border: isLazorkit ? 'border-gray-200' : 'border-white/10',
        borderSubtle: isLazorkit ? 'border border-gray-100' : 'border border-white/10',
        borderAccent: isLazorkit ? 'border-[#7857FF]/20' : 'border-purple-500/30',

        // Buttons
        btnPrimary: isLazorkit
            ? 'px-6 py-3 bg-[#7857FF] hover:bg-[#674BF7] text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/20'
            : 'px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/50',
        btnSecondary: isLazorkit
            ? 'px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-xl font-semibold transition-all'
            : 'px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all',
        btnDanger: 'px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold transition-all',

        // Status
        statusSuccess: isLazorkit
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-green-500/10 border border-green-500/30 text-green-400',
        statusWarning: isLazorkit
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
        statusError: isLazorkit
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-red-500/10 border border-red-500/30 text-red-400',

        // Info boxes
        infoBlue: isLazorkit
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-blue-500/10 border border-blue-500/20',
        infoBlueTitle: isLazorkit ? 'text-blue-800' : 'text-blue-400',
        infoBlueText: isLazorkit ? 'text-blue-700' : 'text-blue-300',
        infoPurple: isLazorkit
            ? 'bg-[#F5F3FF] border border-[#ECE9FF]'
            : 'bg-purple-500/10 border border-purple-500/20',
        infoPurpleTitle: isLazorkit ? 'text-[#7857FF]' : 'text-purple-400',
        infoPurpleText: isLazorkit ? 'text-[#674BF7]' : 'text-purple-300',
        infoYellow: isLazorkit
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-yellow-500/10 border border-yellow-500/20',
        infoYellowTitle: isLazorkit ? 'text-amber-800' : 'text-yellow-400',
        infoYellowText: isLazorkit ? 'text-amber-700' : 'text-yellow-300',

        // Special
        glass: isLazorkit
            ? 'bg-white/90 backdrop-blur-lg border-b border-gray-100'
            : 'bg-white/5 backdrop-blur-lg',
        codeBlock: isLazorkit
            ? 'bg-slate-900 text-gray-100'
            : 'bg-gray-800 text-gray-100',
    };
}

/**
 * React hook style helper - use with useTheme()
 * Example: const theme = useThemeClasses();
 */
export function createThemeClasses(isLazorkit: boolean) {
    return getThemeClasses(isLazorkit);
}
