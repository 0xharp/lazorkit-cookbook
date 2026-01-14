import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lazorkitColors, ThemeColors } from '@/lib/theme';

export type Theme = 'dark' | 'lazorkit';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    isLazorkit: boolean;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'lazorkit-cookbook-theme';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>('lazorkit');
    const [mounted, setMounted] = useState(false);

    // Load theme from AsyncStorage on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && (savedTheme === 'dark' || savedTheme === 'lazorkit')) {
                    setTheme(savedTheme);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            } finally {
                setMounted(true);
            }
        };
        loadTheme();
    }, []);

    // Save theme to AsyncStorage when it changes
    useEffect(() => {
        if (!mounted) return;
        AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(console.error);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'lazorkit' : 'dark');
    };

    const isLazorkit = theme === 'lazorkit';
    const colors = isLazorkit ? lazorkitColors : darkColors;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isLazorkit, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return default dark theme if context not available
        return {
            theme: 'dark',
            toggleTheme: () => { },
            isLazorkit: false,
            colors: darkColors,
        };
    }
    return context;
}
