import { useTheme } from '@/contexts/ThemeContext';
import { createThemeStyles, ThemeStyles, ThemeColors } from '@/lib/theme';

/**
 * Hook that returns theme-aware styles and colors.
 * Use this in any component to get consistent theme styling.
 *
 * @example
 * const theme = useThemeStyles();
 * return (
 *     <View style={theme.card}>
 *         <Text style={theme.title}>Hello</Text>
 *     </View>
 * );
 */
export function useThemeStyles(): ThemeStyles & {
    isLazorkit: boolean;
    colors: ThemeColors;
} {
    const { isLazorkit, colors } = useTheme();
    const styles = createThemeStyles(colors);

    return {
        ...styles,
        isLazorkit,
        colors,
    };
}
