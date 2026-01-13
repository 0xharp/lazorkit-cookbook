'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'lazorkit';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    isLazorkit: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'lazorkit-cookbook-theme';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'lazorkit')) {
            setTheme(savedTheme);
        }
        setMounted(true);
    }, []);

    // Apply theme class to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('dark', 'lazorkit');
        root.classList.add(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'lazorkit' : 'dark');
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isLazorkit: theme === 'lazorkit' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    // Return default dark theme during SSR pre-rendering when context is not available
    if (!context) {
        return {
            theme: 'dark',
            toggleTheme: () => { },
            isLazorkit: false,
        };
    }
    return context;
}
