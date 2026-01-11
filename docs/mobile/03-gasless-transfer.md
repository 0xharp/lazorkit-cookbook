# Example 02: Gasless USDC Transfer

Send USDC tokens without paying gas fees using LazorKit's paymaster.

## Overview

This example demonstrates:
- Building USDC transfer instructions
- Automatic Associated Token Account creation
- Gasless transaction execution
- Retry logic with exponential backoff

## Key Concepts

### Building Transfer Instructions

The transfer logic is identical to web - these utilities are platform-agnostic:

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

### Sending Gasless

```typescript
const signature = await signAndSendTransaction(
  {
    instructions,
    transactionOptions: {
      computeUnitLimit: 200_000,  // Sufficient for transfers
    },
  },
  { redirectUrl: 'lazorkitcookbook://examples/02-gasless-transfer' }
);
```

### Retry Logic

Network issues happen. Use retry with exponential backoff:

```typescript
import { withRetry } from '@/lib/solana-utils';

const signature = await withRetry(
  async () => signAndSendTransaction({ instructions }),
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
[`mobile/app/examples/02-gasless-transfer.tsx`](../../mobile/app/examples/02-gasless-transfer.tsx)
