import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { shortenAddress } from '@/lib/solana-utils';

interface WalletStatusProps {
    address: string;
    solBalance?: number | null;
    usdcBalance?: number | null;
    onDisconnect?: () => void;
}

export function WalletStatus({ address, solBalance, usdcBalance, onDisconnect }: WalletStatusProps) {
    const handleCopyAddress = async () => {
        await Clipboard.setStringAsync(address);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
            </View>

            <TouchableOpacity onPress={handleCopyAddress} style={styles.addressContainer}>
                <Text style={styles.address}>{shortenAddress(address, 6)}</Text>
                <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>

            {(solBalance !== undefined && solBalance !== null || usdcBalance !== undefined && usdcBalance !== null) && (
                <View style={styles.balances}>
                    {solBalance !== undefined && solBalance !== null && (
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>SOL</Text>
                            <Text style={styles.balanceValue}>{solBalance.toFixed(4)}</Text>
                        </View>
                    )}
                    {usdcBalance !== undefined && usdcBalance !== null && (
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>USDC</Text>
                            <Text style={styles.balanceValue}>{usdcBalance.toFixed(2)}</Text>
                        </View>
                    )}
                </View>
            )}

            {onDisconnect && (
                <TouchableOpacity onPress={onDisconnect} style={styles.disconnectButton}>
                    <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#2d2d44',
        borderRadius: 12,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
        marginRight: 8,
    },
    statusText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
    },
    addressContainer: {
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    address: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    copyHint: {
        color: '#6366f1',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    balances: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    balanceItem: {
        alignItems: 'center',
    },
    balanceLabel: {
        color: '#a0a0a0',
        fontSize: 12,
        marginBottom: 4,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    disconnectButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    disconnectText: {
        color: '#ef4444',
        fontSize: 14,
    },
});
