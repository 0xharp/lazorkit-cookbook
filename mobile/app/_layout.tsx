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
import { Header } from '@/components/Header';
import { colors } from '@/lib/theme';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <LazorkitProvider>
                <WalletProvider>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            header: () => <Header />,
                            contentStyle: {
                                backgroundColor: colors.gradient.start,
                            },
                        }}
                    >
                        <Stack.Screen
                            name="index"
                            options={{
                                title: 'Home',
                            }}
                        />
                        <Stack.Screen
                            name="examples/01-connect-wallet"
                            options={{
                                title: 'Connect Wallet',
                            }}
                        />
                        <Stack.Screen
                            name="examples/02-gasless-transfer"
                            options={{
                                title: 'Gasless Transfer',
                            }}
                        />
                        <Stack.Screen
                            name="examples/03-raydium-swap"
                            options={{
                                title: 'Raydium Swap',
                            }}
                        />
                    </Stack>
                </WalletProvider>
            </LazorkitProvider>
        </SafeAreaProvider>
    );
}
