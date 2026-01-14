// Polyfills - MUST be at the very top before any other imports
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LazorkitProvider } from '@/providers/LazorkitProvider';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/Header';

function AppContent() {
    const { colors, isLazorkit } = useTheme();

    return (
        <>
            <StatusBar style={isLazorkit ? 'dark' : 'light'} />
            <Stack
                screenOptions={{
                    header: () => <Header />,
                    contentStyle: {
                        backgroundColor: colors.gradient.start,
                    },
                    // Theme-aware navigation title bar
                    headerStyle: {
                        backgroundColor: isLazorkit ? '#7857FF' : '#1e1b4b',
                    },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: {
                        fontWeight: '600',
                        color: '#ffffff',
                    },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'Home',
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <LazorkitProvider>
                    <WalletProvider>
                        <AppContent />
                    </WalletProvider>
                </LazorkitProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
