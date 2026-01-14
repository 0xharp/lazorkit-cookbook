'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeClasses, ThemeClasses } from '@/lib/theme';

/**
 * Hook that returns theme-aware class names.
 * Use this in any component to get consistent theme styling.
 * 
 * @example
 * const theme = useThemeClasses();
 * return <div className={theme.bgCard}>...</div>;
 */
export function useThemeClasses(): ThemeClasses & { isLazorkit: boolean } {
    const { isLazorkit } = useTheme();
    const classes = getThemeClasses(isLazorkit);

    return {
        ...classes,
        isLazorkit,
    };
}
