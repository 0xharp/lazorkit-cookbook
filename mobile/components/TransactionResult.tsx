import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { getExplorerUrl } from '@/lib/constants';
import { shortenAddress } from '@/lib/solana-utils';

interface TransactionResultProps {
    signature: string;
    message?: string;
    onDismiss?: () => void;
}

export function TransactionResult({ signature, message, onDismiss }: TransactionResultProps) {
    const handleViewExplorer = () => {
        const url = getExplorerUrl(signature);
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>✓</Text>
            </View>

            <Text style={styles.title}>Transaction Successful</Text>

            {message && <Text style={styles.message}>{message}</Text>}

            <View style={styles.signatureContainer}>
                <Text style={styles.signatureLabel}>Signature</Text>
                <Text style={styles.signature}>{shortenAddress(signature, 8)}</Text>
            </View>

            <TouchableOpacity onPress={handleViewExplorer} style={styles.explorerButton}>
                <Text style={styles.explorerText}>View on Solana Explorer</Text>
            </TouchableOpacity>

            {onDismiss && (
                <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                    <Text style={styles.dismissText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a4731',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    message: {
        color: '#a7f3d0',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    signatureContainer: {
        backgroundColor: '#0d3320',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        marginBottom: 16,
    },
    signatureLabel: {
        color: '#6ee7b7',
        fontSize: 12,
        marginBottom: 4,
    },
    signature: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    explorerButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#166534',
        borderRadius: 8,
        marginBottom: 12,
    },
    explorerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dismissButton: {
        paddingVertical: 8,
    },
    dismissText: {
        color: '#6ee7b7',
        fontSize: 14,
    },
});
