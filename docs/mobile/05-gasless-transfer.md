# Example: Gasless USDC Transfer

Send USDC tokens without paying gas fees using LazorKit's paymaster.

## Overview

This example demonstrates:
- Building USDC transfer instructions
- Automatic Associated Token Account creation
- Gasless transaction execution
- Retry logic with exponential backoff

## Using the Cookbook's WalletContext

With our `WalletContext` wrapper, you don't need to manually construct redirect URLs:

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { buildUsdcTransferInstructions } from '@/lib/solana-utils';

function TransferScreen() {
    const { wallet, signAndSendTransaction } = useLazorkitWalletConnect();

    const handleTransfer = async () => {
        const instructions = await buildUsdcTransferInstructions(
            connection,
            new PublicKey(wallet.smartWallet),
            recipientPubkey,
            amount
        );

        // Just pass the return path - WalletContext handles redirectUrl
        const signature = await signAndSendTransaction(
            {
                instructions,
                transactionOptions: { computeUnitLimit: 200_000 },
            },
            'examples/02-gasless-transfer'
        );
    };
}
```

## Using LazorKit SDK Directly

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import * as Linking from 'expo-linking';

const { signAndSendTransaction } = useWallet();

const signature = await signAndSendTransaction(
    {
        instructions,
        transactionOptions: { computeUnitLimit: 200_000 },
    },
    { redirectUrl: Linking.createURL('examples/02-gasless-transfer') }
);
```

## Key Concepts

### Building Transfer Instructions

The transfer logic is platform-agnostic - these utilities work on both web and mobile:

```typescript
import { buildUsdcTransferInstructions } from '@/lib/solana-utils';

const instructions = await buildUsdcTransferInstructions(
    connection,
    senderPubkey,
    recipientPubkey,
    amount  // in USDC (e.g., 1.5)
);
```

This function:
1. Derives token account addresses for sender and recipient
2. Creates recipient's token account if it doesn't exist
3. Builds the SPL Token transfer instruction

### Retry Logic

Network issues happen. Use retry with exponential backoff:

```typescript
import { withRetry } from '@/lib/solana-utils';

const signature = await withRetry(
    async () => signAndSendTransaction(
        { instructions },
        'examples/02-gasless-transfer'
    ),
    {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt) => setRetryCount(attempt),
    }
);
```

### Keyboard Handling

Mobile forms need proper keyboard handling:

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={100}
>
    <ScrollView keyboardShouldPersistTaps="handled">
        <TextInput
            placeholder="Recipient address"
            autoCapitalize="none"
            autoCorrect={false}
        />
        <TextInput
            placeholder="Amount"
            keyboardType="decimal-pad"
        />
    </ScrollView>
</KeyboardAvoidingView>
```

## Full Example

See the complete implementation at:
[`mobile/app/examples/02-gasless-transfer/index.tsx`](../../mobile/app/examples/02-gasless-transfer/index.tsx)

## Next Steps

- [Raydium Swap](./06-raydium-swap.md) - External SDK integration
- [Cookbook Patterns](./03-cookbook-patterns.md) - All utility patterns explained
