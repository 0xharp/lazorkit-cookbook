# Recipe 03: Gasless Raydium Swap (Mobile)

**Swap tokens on Raydium DEX without paying gas fees - LazorKit handles everything**

This advanced recipe demonstrates how to integrate an existing DeFi protocol (Raydium) with LazorKit's gasless transaction infrastructure on mobile. Users can swap tokens without needing SOL for gas fees, providing a seamless mobile trading experience.

> **Environment**: Expo 54 + React Native. See [`_layout.tsx`](../../_layout.tsx) for required polyfills.

---

## What You'll Learn

- Integrate Raydium Trade API for swap quotes and transactions
- Handle legacy transactions from external protocols
- Work around LazorKit validation requirements
- Manage token accounts and balances for DEX trading
- Build a gasless mobile swap interface
- Use the `processInstructionsForLazorKit` utility

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE GASLESS SWAP FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │  Mobile UI  │───▶│ Raydium API  │───▶│  Get Quote + Build Tx   │ │
│  │   (Expo)    │    │  (Trade API) │    │  (Legacy Transaction)   │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────┘ │
│         │                                           │                │
│         │                                           ▼                │
│         │           ┌──────────────────────────────────────────┐    │
│         └──────────▶│   processInstructionsForLazorKit()       │    │
│                     │  1. Deserialize legacy tx                │    │
│                     │  2. Remove ComputeBudget instructions    │    │
│                     │  3. Add smart wallet to all instructions │    │
│                     └──────────────────────────────────────────┘    │
│                                           │                          │
│                                           ▼                          │
│                     ┌──────────────────────────────────────────┐    │
│                     │     LazorKit Mobile SDK + Paymaster       │    │
│                     │  - Opens portal for passkey signature    │    │
│                     │  - Pays all gas fees                     │    │
│                     │  - Submits to Solana network             │    │
│                     └──────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Completed [Recipe 01](../01-connect-wallet/README.md) and [Recipe 02](../02-gasless-transfer/README.md)
- Understanding of DEX mechanics and token swaps
- Devnet SOL and USDC for testing
- Required packages:
```bash
npm install axios @raydium-io/raydium-sdk-v2
```

---

## Step 1: Import Required Dependencies

```typescript
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { DEV_API_URLS } from '@raydium-io/raydium-sdk-v2';
import { useLazorkitWallet } from '@/hooks/useLazorkitWallet';
import { useBalances } from '@/hooks/useBalances';
import { getConnection, getAssociatedTokenAddressSync } from '@/lib/solana-utils';
import { processInstructionsForLazorKit } from '@/lib/lazorkit-utils';
```

---

## Step 2: Define Token Configuration

```typescript
const TOKENS = {
    SOL: {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
    },
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet
        decimals: 6,
    },
};
```

---

## Step 3: Set Up Hooks and State

```typescript
export default function RaydiumSwapScreen() {
    const { wallet, isConnected, connect, signAndSendTransaction, connecting } = useLazorkitWallet();

    const [inputToken, setInputToken] = useState<'SOL' | 'USDC'>('SOL');
    const [outputToken, setOutputToken] = useState<'SOL' | 'USDC'>('USDC');
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [quoteError, setQuoteError] = useState('');
    const [swapping, setSwapping] = useState(false);
    const [lastTxSignature, setLastTxSignature] = useState('');

    const { solBalance, usdcBalance, fetchBalances } = useBalances(
        isConnected ? wallet?.smartWallet : null
    );

    const balances = {
        SOL: solBalance ?? 0,
        USDC: usdcBalance ?? 0,
    };
}
```

---

## Step 4: Get Swap Quote from Raydium

Use Raydium's Trade API with debounced input:

```typescript
const calculateOutputAmount = async () => {
    if (!wallet || !inputAmount || parseFloat(inputAmount) <= 0) {
        setOutputAmount('');
        setQuoteError('');
        return;
    }

    setQuoteError('');
    try {
        const inputMint = TOKENS[inputToken].mint;
        const outputMint = TOKENS[outputToken].mint;
        const amount = parseFloat(inputAmount) * Math.pow(10, TOKENS[inputToken].decimals);

        const quoteResponse = await fetch(
            `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
            `inputMint=${inputMint}&` +
            `outputMint=${outputMint}&` +
            `amount=${Math.floor(amount)}&` +
            `slippageBps=50&` +
            `txVersion=LEGACY`
        );

        if (!quoteResponse.ok) {
            throw new Error('Failed to get quote from Raydium API');
        }

        const quoteData = await quoteResponse.json();

        if (!quoteData.success || !quoteData.data) {
            throw new Error('No liquidity available for this pair');
        }

        const outputAmountRaw = parseFloat(quoteData.data.outputAmount);
        const formattedOutput = (outputAmountRaw / Math.pow(10, TOKENS[outputToken].decimals)).toFixed(6);

        setOutputAmount(formattedOutput);
    } catch (err: any) {
        setQuoteError(err.message || 'Failed to get quote');
        setOutputAmount('');
    }
};

// Debounce the quote calculation
useEffect(() => {
    const timeoutId = setTimeout(calculateOutputAmount, 500);
    return () => clearTimeout(timeoutId);
}, [inputAmount, inputToken, outputToken]);
```

---

## Step 5: Build and Execute the Swap

The key is using `processInstructionsForLazorKit` to adapt Raydium's transaction:

```typescript
const handleSwap = async () => {
    if (!wallet || !inputAmount) {
        Alert.alert('Error', 'Please enter an amount');
        return;
    }

    const amount = parseFloat(inputAmount);
    if (amount > (balances[inputToken] || 0)) {
        Alert.alert('Error', `Insufficient ${inputToken} balance`);
        return;
    }

    setSwapping(true);
    try {
        const inputMint = TOKENS[inputToken].mint;
        const outputMint = TOKENS[outputToken].mint;
        const amountIn = Math.floor(amount * Math.pow(10, TOKENS[inputToken].decimals));

        // 1. Get quote
        const { data: swapResponse } = await axios.get(
            `${DEV_API_URLS.SWAP_HOST}/compute/swap-base-in?` +
            `inputMint=${inputMint}&outputMint=${outputMint}&` +
            `amount=${amountIn}&slippageBps=50&txVersion=LEGACY`
        );

        // 2. Get priority fee
        const { data: priorityFeeData } = await axios.get(
            `${DEV_API_URLS.BASE_HOST}${DEV_API_URLS.PRIORITY_FEE}`
        );

        // 3. Build transaction from Raydium (request LEGACY format)
        const { data: swapData } = await axios.post(
            `${DEV_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
            {
                computeUnitPriceMicroLamports: String(priorityFeeData.data.default.h),
                swapResponse,
                txVersion: 'LEGACY', // Important: Request legacy format
                wallet: wallet.smartWallet,
                wrapSol: inputMint === TOKENS.SOL.mint,
                unwrapSol: outputMint === TOKENS.SOL.mint,
                inputAccount: inputMint === TOKENS.SOL.mint
                    ? undefined
                    : getAssociatedTokenAddressSync(new PublicKey(inputMint), new PublicKey(wallet.smartWallet)).toBase58(),
                outputAccount: outputMint === TOKENS.SOL.mint
                    ? undefined
                    : getAssociatedTokenAddressSync(new PublicKey(outputMint), new PublicKey(wallet.smartWallet)).toBase58(),
            }
        );

        // 4. Deserialize as Legacy Transaction
        const txBuffer = Buffer.from(swapData.data[0].transaction, 'base64');
        const legacyTx = Transaction.from(txBuffer);

        // 5. Process instructions for LazorKit (handles all the complexity)
        const instructions = processInstructionsForLazorKit(
            legacyTx.instructions,
            wallet.smartWallet
        );

        // 6. Send gasless transaction
        const signature = await signAndSendTransaction({
            instructions,
            transactionOptions: { computeUnitLimit: 600_000 }
        });

        setLastTxSignature(signature);

        Alert.alert(
            'Swap Successful!',
            `Swapped ${amount} ${inputToken} for ~${outputAmount} ${outputToken}\n\nNo gas fees paid!`
        );

        setInputAmount('');
        setOutputAmount('');
        await fetchBalances();
    } catch (err: any) {
        console.error('Swap error:', err);
        Alert.alert('Swap Failed', getSwapErrorMessage(err));
    } finally {
        setSwapping(false);
    }
};
```

---

## Step 6: The processInstructionsForLazorKit Utility

This utility (in `lib/lazorkit-utils.ts`) handles the complexity of adapting external protocol transactions:

```typescript
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');

export function processInstructionsForLazorKit(
    instructions: TransactionInstruction[],
    smartWalletAddress: string
): TransactionInstruction[] {
    const smartWallet = new PublicKey(smartWalletAddress);

    return instructions
        // 1. Remove ComputeBudget instructions (LazorKit handles compute)
        .filter(ix => !ix.programId.equals(COMPUTE_BUDGET_PROGRAM))
        // 2. Add smart wallet to instructions that don't have it
        .map(ix => {
            const hasSmartWallet = ix.keys.some(k => k.pubkey.equals(smartWallet));
            if (!hasSmartWallet) {
                ix.keys.push({
                    pubkey: smartWallet,
                    isSigner: false,
                    isWritable: false
                });
            }
            return ix;
        });
}
```

---

## Step 7: Build the Mobile UI

Create a swap interface with token selectors:

```typescript
return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <ScrollView contentContainerStyle={styles.content}>
            {!isConnected ? (
                <TouchableOpacity onPress={() => connect('examples/03-raydium-swap')}>
                    <Text>Connect Wallet</Text>
                </TouchableOpacity>
            ) : (
                <View>
                    {/* Balances */}
                    <View style={styles.balanceCard}>
                        <Text>SOL: {balances.SOL.toFixed(4)}</Text>
                        <Text>USDC: {balances.USDC.toFixed(2)}</Text>
                    </View>

                    {/* Input Token */}
                    <View style={styles.tokenSection}>
                        <Text>You Pay</Text>
                        <TextInput
                            value={inputAmount}
                            onChangeText={setInputAmount}
                            placeholder="0.0"
                            keyboardType="decimal-pad"
                        />
                        <View style={styles.tokenSelector}>
                            <TouchableOpacity
                                onPress={() => setInputToken('SOL')}
                                style={[styles.tokenBtn, inputToken === 'SOL' && styles.active]}
                            >
                                <Text>SOL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setInputToken('USDC')}
                                style={[styles.tokenBtn, inputToken === 'USDC' && styles.active]}
                            >
                                <Text>USDC</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Flip Button */}
                    <TouchableOpacity onPress={handleFlipTokens} style={styles.flipBtn}>
                        <Text>⇅</Text>
                    </TouchableOpacity>

                    {/* Output Token */}
                    <View style={styles.tokenSection}>
                        <Text>You Receive</Text>
                        <Text style={styles.outputValue}>{outputAmount || '0.0'}</Text>
                        <Text style={styles.outputToken}>{outputToken}</Text>
                    </View>

                    {/* Error */}
                    {quoteError && (
                        <View style={styles.errorCard}>
                            <Text style={styles.errorText}>{quoteError}</Text>
                        </View>
                    )}

                    {/* Swap Button */}
                    <TouchableOpacity
                        onPress={handleSwap}
                        disabled={swapping || !inputAmount || !!quoteError}
                        style={styles.swapButton}
                    >
                        <Text>{swapping ? 'Swapping...' : 'Swap (Gas-Free)'}</Text>
                    </TouchableOpacity>

                    <Text style={styles.poweredBy}>No gas fees - Powered by LazorKit</Text>
                </View>
            )}
        </ScrollView>
    </KeyboardAvoidingView>
);
```

---

## Integration Challenges & Solutions

When integrating external protocols like Raydium with LazorKit:

### 1. Transaction Format
**Problem**: Versioned transactions (V0) may not work with LazorKit.
**Solution**: Request legacy transactions: `txVersion: 'LEGACY'`

### 2. ComputeBudget Instructions
**Problem**: LazorKit manages compute budget automatically.
**Solution**: Filter out ComputeBudget instructions using `processInstructionsForLazorKit`.

### 3. Smart Wallet Validation
**Problem**: LazorKit's `execute_cpi` expects the smart wallet in ALL instruction key lists.
**Solution**: Add the smart wallet to any instruction that doesn't include it.

---

## Complete Example

The complete implementation uses centralized hooks and the shared utility function.

**Custom Hooks Used:**

| Hook | Description |
|------|-------------|
| `useLazorkitWallet()` | Mobile wallet connection with deep link flow |
| `useBalances()` | Automatic SOL/USDC balance management |

**Utility Functions:**

| Function | Description |
|----------|-------------|
| `processInstructionsForLazorKit()` | Adapts external protocol transactions for LazorKit |
| `getAssociatedTokenAddressSync()` | Derives token account addresses |
| `getConnection()` | Returns a cached Solana connection instance |

**Key Pattern - Protocol Integration:**

```typescript
// 1. Get transaction from external protocol (Raydium)
const { data: swapData } = await axios.post(RAYDIUM_API, {
    txVersion: 'LEGACY', // Request legacy format
    wallet: wallet.smartWallet,
    // ... other params
});

// 2. Deserialize the transaction
const legacyTx = Transaction.from(Buffer.from(swapData.transaction, 'base64'));

// 3. Process for LazorKit (removes ComputeBudget, adds smart wallet)
const instructions = processInstructionsForLazorKit(
    legacyTx.instructions,
    wallet.smartWallet
);

// 4. Send gasless
const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 600_000 }
});
```

> **Source**: See the full implementation at [`index.tsx`](index.tsx)

---

## Devnet Limitations

This recipe currently supports the **SOL/USDC** pair on Devnet. Important notes:

- Devnet liquidity pools can be unreliable
- Some swap directions may fail due to imbalanced pools
- If USDC→SOL fails, try SOL→USDC instead
- The same code works reliably on Mainnet where pools are properly maintained

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No liquidity" | Devnet pools may have limited liquidity - try smaller amounts |
| "Transaction too large" | Complex routes may exceed limits - try a direct pair |
| "Slippage exceeded" | Increase slippage tolerance or try again |
| "Pool error" | Try swapping in the opposite direction |
| "Insufficient balance" | Ensure you have enough of the input token |
| Deep link not returning | Verify app scheme configuration |

---

## Next Steps

- Apply this pattern to integrate other DeFi protocols (Jupiter, Orca, etc.)
- Build your own gasless mobile DeFi application
- Check the [web examples](/web/app/examples/) for more advanced recipes

---

## Resources

- [Raydium Trade API Documentation](https://docs.raydium.io/raydium/traders/trade-api)
- [LazorKit Mobile SDK Documentation](https://docs.lazorkit.com/mobile-sdk/)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Circle USDC Faucet (Devnet)](https://faucet.circle.com)
