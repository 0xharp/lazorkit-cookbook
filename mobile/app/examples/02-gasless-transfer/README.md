# Recipe 02: Gasless USDC Transfer (Mobile)

**Send USDC tokens without paying SOL gas fees - LazorKit's paymaster covers everything**

This recipe demonstrates one of LazorKit's most powerful features: gasless transactions. Your users can send USDC without ever needing to buy or hold SOL for gas fees. This dramatically reduces onboarding friction and provides a seamless mobile payment experience.

> **Environment**: Expo 54 + React Native. See [`_layout.tsx`](../../_layout.tsx) for required polyfills.

---

## What You'll Learn

- Send USDC tokens without paying SOL for gas
- How LazorKit's paymaster service works
- Build SPL token transfer instructions
- Automatically create recipient token accounts if needed
- Handle transaction signing and confirmation on mobile
- Implement proper form validation and error handling

---

## The Problem with Traditional Solana UX

Traditional Solana apps require users to:

1. Buy SOL on an exchange (KYC, fees, complexity)
2. Transfer SOL to their wallet
3. Keep enough SOL for gas fees
4. Hope they don't run out mid-transaction

**This creates massive onboarding friction.** Many users drop off at step 1.

---

## The LazorKit Solution: Gasless Transactions

With LazorKit's paymaster, users only need the tokens they want to send. The paymaster:

1. Detects your transaction needs gas
2. Adds its signature to cover the fee
3. Submits the transaction atomically
4. User pays nothing in SOL

```typescript
// User only needs USDC, not SOL
const signature = await signAndSendTransaction({
  instructions: [transferIx],
});
// Transaction complete - user paid $0 in gas
```

---

## Prerequisites

Before starting, ensure you have:

1. Completed [Recipe 01](../01-connect-wallet/README.md) (understand mobile wallet basics)
2. Required packages installed:
```bash
npm install @lazorkit/wallet-mobile-adapter @solana/web3.js @solana/spl-token
```
3. Some devnet USDC in your wallet (get from [Circle Faucet](https://faucet.circle.com))

---

## Step 1: Import Required Dependencies

```typescript
import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { PublicKey } from '@solana/web3.js';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import {
    getConnection,
    buildUsdcTransferInstructions,
    formatTransactionError,
    withRetry,
} from '@/lib/solana-utils';
import { COMPUTE_UNITS } from '@/lib/constants';
```

---

## Step 2: Set Up the Hooks

Use the centralized hooks for wallet connection and balance management:

```typescript
export default function GaslessTransferScreen() {
    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWalletConnect();

    // Balance management
    const { usdcBalance, loading, fetchBalances } = useBalances(
        isConnected ? wallet?.smartWallet : null
    );

    // Form state
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);
    const [lastTxSignature, setLastTxSignature] = useState('');

    // ... rest of component
}
```

---

## Step 3: Validate Inputs

Validate the recipient address and amount before sending:

```typescript
const validateInputs = (): { valid: boolean; error?: string; recipientPubkey?: PublicKey; amountNum?: number } => {
    // Validate recipient address
    try {
        const recipientPubkey = new PublicKey(recipient.trim());
        if (!PublicKey.isOnCurve(recipientPubkey)) {
            return { valid: false, error: 'Invalid Solana address' };
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return { valid: false, error: 'Please enter a valid amount' };
        }

        if (usdcBalance !== null && amountNum > usdcBalance) {
            return { valid: false, error: `Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC` };
        }

        return { valid: true, recipientPubkey, amountNum };
    } catch {
        return { valid: false, error: 'Invalid recipient address format' };
    }
};
```

---

## Step 4: Build the Transfer Function

Here's the complete gasless transfer implementation:

```typescript
const handleSend = async () => {
    if (!wallet?.smartWallet) {
        Alert.alert('Error', 'Please connect your wallet first');
        return;
    }

    const validation = validateInputs();
    if (!validation.valid) {
        Alert.alert('Validation Error', validation.error);
        return;
    }

    setSending(true);

    try {
        const signature = await withRetry(
            async () => {
                const connection = getConnection();
                const senderPubkey = new PublicKey(wallet.smartWallet);

                // Build transfer instructions (handles ATA creation automatically)
                const instructions = await buildUsdcTransferInstructions(
                    connection,
                    senderPubkey,
                    validation.recipientPubkey!,
                    validation.amountNum!
                );

                // Send gasless transaction
                const sig = await signAndSendTransaction({
                    instructions,
                    transactionOptions: { computeUnitLimit: COMPUTE_UNITS.TOKEN_TRANSFER }
                });

                await connection.confirmTransaction(sig, 'confirmed');
                return sig;
            },
            {
                maxRetries: 3,
                initialDelayMs: 1000,
                onRetry: (attempt) => console.log(`Retry attempt ${attempt}`),
            }
        );

        setLastTxSignature(signature);

        Alert.alert(
            'Success!',
            `Sent ${validation.amountNum} USDC\n\nNo gas fees paid!`,
            [
                { text: 'View Transaction', onPress: () => handleViewTransaction(signature) },
                { text: 'OK' }
            ]
        );

        // Reset form
        setRecipient('');
        setAmount('');
        await fetchBalances();
    } catch (err) {
        console.error('Transfer error:', err);
        Alert.alert('Transfer Failed', formatTransactionError(err, 'Transfer'));
    } finally {
        setSending(false);
    }
};
```

---

## Step 5: Build the UI

Create a mobile-friendly form with proper keyboard handling:

```typescript
return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <ScrollView contentContainerStyle={styles.content}>
            {!isConnected ? (
                <TouchableOpacity onPress={() => connect('examples/02-gasless-transfer')}>
                    <Text>Connect Wallet</Text>
                </TouchableOpacity>
            ) : (
                <View>
                    {/* Balance Display */}
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Your USDC Balance</Text>
                        <Text style={styles.balanceValue}>
                            {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Loading...'}
                        </Text>
                    </View>

                    {/* Transfer Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.inputLabel}>Recipient Address</Text>
                        <TextInput
                            style={styles.input}
                            value={recipient}
                            onChangeText={setRecipient}
                            placeholder="Enter Solana address..."
                            placeholderTextColor="#6b7280"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.inputLabel}>Amount (USDC)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#6b7280"
                            keyboardType="decimal-pad"
                        />

                        {/* Max button */}
                        {usdcBalance !== null && usdcBalance > 0 && (
                            <TouchableOpacity onPress={() => setAmount(usdcBalance.toString())}>
                                <Text style={styles.maxButton}>Use Max ({usdcBalance.toFixed(2)})</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={sending || !recipient || !amount}
                            style={[styles.sendButton, (sending || !recipient || !amount) && styles.disabled]}
                        >
                            <Text style={styles.sendButtonText}>
                                {sending ? 'Sending...' : 'Send USDC (Gasless!)'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Gasless Info */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            100% Gasless - LazorKit's paymaster covers all transaction fees.
                            You don't need any SOL!
                        </Text>
                    </View>

                    {/* Last Transaction */}
                    {lastTxSignature && (
                        <TouchableOpacity
                            onPress={() => handleViewTransaction(lastTxSignature)}
                            style={styles.txCard}
                        >
                            <Text style={styles.txLabel}>Last Transaction:</Text>
                            <Text style={styles.txSignature}>
                                {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-8)}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </ScrollView>
    </KeyboardAvoidingView>
);
```

---

## How the Paymaster Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your Mobile   │────▶│  LazorKit SDK    │────▶│   Paymaster     │
│  App (Instrs)   │     │  (Sign Request)  │     │  (Pays Gas)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Solana Network │
                                                 │  (Transaction)  │
                                                 └─────────────────┘
```

1. **Your Mobile App** builds transaction instructions (transfer USDC)
2. **LazorKit SDK** packages the transaction and opens portal for signature
3. **Paymaster** adds gas payment and submits to network
4. **Solana Network** processes the transaction

**The user never sees or pays any SOL fees.**

---

## Complete Example

The complete implementation uses centralized hooks and utility functions for clean, maintainable code.

**Custom Hooks Used:**

| Hook | Description |
|------|-------------|
| `useLazorkitWalletConnect()` | Mobile wallet connection with deep link flow |
| `useBalances()` | Automatic SOL/USDC balance management |

**Utility Functions:**

| Function | Description |
|----------|-------------|
| `buildUsdcTransferInstructions()` | Builds transfer with automatic ATA creation |
| `withRetry()` | Retries failed transactions with exponential backoff |
| `formatTransactionError()` | Formats errors for user-friendly display |
| `getConnection()` | Returns a cached Solana connection instance |

**Key Pattern - Gasless Transfer:**

```typescript
const { signAndSendTransaction } = useLazorkitWalletConnect();

// Build instructions (handles ATA creation automatically)
const instructions = await buildUsdcTransferInstructions(
  connection,
  senderPubkey,
  recipientPubkey,
  amount
);

// Send gasless with retry logic
const signature = await withRetry(
  async () => signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 200_000 }
  }),
  { maxRetries: 3 }
);
```

> **Source**: See the full implementation at [`index.tsx`](index.tsx)

---

## Key Concepts

### Associated Token Accounts (ATAs)
SPL tokens aren't stored in your main wallet address. Instead, each token type has a derived "Associated Token Account". The ATA address is deterministically derived from:
- Your wallet address (owner)
- The token mint address (e.g., USDC)
- The Token Program ID

### Automatic ATA Creation
If the recipient doesn't have a USDC token account, you need to create one. The `buildUsdcTransferInstructions` utility handles this automatically.

### Compute Unit Limit
We set `computeUnitLimit: 200_000` to ensure enough compute budget for complex transactions. This doesn't affect the user - the paymaster handles it.

---

## Mobile-Specific Considerations

### Keyboard Handling
Use `KeyboardAvoidingView` to ensure the form remains visible when the keyboard opens:

```typescript
<KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
    <ScrollView keyboardShouldPersistTaps="handled">
        {/* Form content */}
    </ScrollView>
</KeyboardAvoidingView>
```

### Input Types
Use appropriate keyboard types for better UX:
- Address input: `autoCapitalize="none"` `autoCorrect={false}`
- Amount input: `keyboardType="decimal-pad"`

---

## Use Cases for Gasless Transfers

| Use Case | Description |
|----------|-------------|
| **Payments** | Users pay for goods/services in USDC without SOL |
| **Tipping** | Tip content creators without friction |
| **Remittances** | Send stablecoins to family without crypto complexity |
| **Commerce** | "Pay with Solana" checkout without gas fees |
| **Gaming** | In-game purchases without SOL requirements |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Insufficient balance" | User needs more USDC - get from faucet |
| "Invalid recipient" | Ensure it's a valid Solana address (base58) |
| "Transaction failed" | Check network connection, try again |
| Deep link not returning | Verify app scheme configuration |
| Keyboard covers form | Ensure `KeyboardAvoidingView` is properly configured |

---

## Next Steps

Ready for more advanced features? Proceed to:

- **[Recipe 03: Gasless Raydium Swap](../03-raydium-swap/README.md)** - Swap tokens on Raydium DEX without gas fees!

---

## Resources

- [LazorKit Paymaster Documentation](https://docs.lazorkit.com/mobile-sdk/gasless-transactions)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Circle USDC Faucet (Devnet)](https://faucet.circle.com)
