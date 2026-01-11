# Subscription Service Integration

This tutorial shows how to build blockchain-native recurring payments using LazorKit and a custom Anchor program.

## What You'll Build

A subscription billing system where users can:
- Subscribe to a plan with a single Face ID authentication
- Get charged automatically every billing cycle (no signatures needed!)
- Cancel anytime with rent refunds

This is exactly like Netflix or Spotify - but on Solana.

## The Magic: Token Delegation

The key innovation is Solana's token delegation. When a user subscribes:

1. User authenticates once with Face ID (via LazorKit)
2. Their token account delegates spending permission to the subscription PDA
3. The merchant backend can now charge automatically without requiring signatures

```typescript
// During subscription, user delegates tokens to the PDA
const delegateIx = createApproveInstruction(
  userTokenAccount,
  subscriptionPDA,    // PDA becomes delegate
  userWallet,
  delegationAmount
);
```

## Step 1: Define Subscription Plans

Create a configuration for your subscription plans:

```typescript
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;           // in USDC
  intervalSeconds: number; // billing cycle
  features: string[];
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    intervalSeconds: 30 * 24 * 60 * 60, // 30 days
    features: ['Feature 1', 'Feature 2'],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 19.99,
    intervalSeconds: 30 * 24 * 60 * 60,
    features: ['All Basic features', 'Premium support'],
  },
];
```

## Step 2: Derive the Subscription PDA

Each subscription is stored in a unique Program Derived Address:

```typescript
import { PublicKey } from '@solana/web3.js';

const getSubscriptionPDA = (userWallet: PublicKey, merchantWallet: PublicKey) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('subscription'),
      userWallet.toBuffer(),
      merchantWallet.toBuffer(),
    ],
    SUBSCRIPTION_PROGRAM_ID
  );
  return pda;
};
```

## Step 3: Build Subscribe Instructions

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

const handleSubscribe = async (plan: SubscriptionPlan) => {
  // Build the subscription instructions
  const instructions = await buildInitializeSubscriptionIx({
    userWallet: new PublicKey(wallet.smartWallet),
    amountPerPeriod: plan.price,
    intervalSeconds: plan.intervalSeconds,
    expiresAt: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
  }, connection);

  // Send gasless transaction - first payment charged immediately
  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 600_000 }
  });

  console.log('Subscribed! First payment processed.');
};
```

## Step 4: Cancel Subscription

```typescript
const handleCancel = async () => {
  const instruction = await buildCancelSubscriptionIx(
    new PublicKey(wallet.smartWallet)
  );

  // Gasless cancellation - revokes delegation and refunds rent
  const signature = await signAndSendTransaction({
    instructions: [instruction],
    transactionOptions: { computeUnitLimit: 600_000 }
  });

  console.log('Cancelled! Rent refunded.');
};
```

## Step 5: Backend Charging Job

Create an API route that charges due subscriptions:

```typescript
// api/charge-subscriptions/route.ts
export async function POST(request: Request) {
  const connection = getConnection();

  // Fetch all subscription accounts
  const accounts = await connection.getProgramAccounts(SUBSCRIPTION_PROGRAM_ID);

  const results = { charged: 0, skipped: 0 };

  for (const { pubkey, account } of accounts) {
    const subscription = parseSubscriptionData(account.data);

    // Check if subscription is due for charging
    if (isChargeDue(subscription)) {
      const instruction = buildChargeInstruction(
        pubkey,
        subscription.userTokenAccount,
        merchantTokenAccount
      );

      // Merchant signs - uses PDA delegation to transfer tokens
      await sendAndConfirmTransaction(connection, transaction, [merchantKeypair]);
      results.charged++;
    } else {
      results.skipped++;
    }
  }

  return Response.json(results);
}
```

## Complete Flow

```
User clicks "Subscribe"
         |
         v
Build subscribe instructions (init + delegate)
         |
         v
signAndSendTransaction() via LazorKit
         |
         v
User authenticates with Face ID (one time!)
         |
         v
Subscription PDA created, tokens delegated
         |
         v
First payment charged immediately
         |
         v
[Time passes - billing cycle]
         |
         v
Backend job scans subscriptions
         |
         v
Charges due subscriptions using PDA delegation
         |
         v
No user interaction required!
```

## Architecture

| Component | Role |
|-----------|------|
| **Frontend** | Subscribe/cancel UI with LazorKit |
| **Anchor Program** | On-chain subscription state, delegation management |
| **Backend Job** | Scans subscriptions, charges due accounts |
| **LazorKit** | Gasless user transactions (subscribe, cancel) |

## LazorKit Benefits

| Benefit | Description |
|---------|-------------|
| **Gasless Subscribe** | Users subscribe without paying gas |
| **Gasless Cancel** | Users cancel without paying gas |
| **Face ID Auth** | Simple authentication, no seed phrases |
| **Smart Wallet** | Persistent address for stable PDAs |

## Anchor Program Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_subscription` | Create subscription, delegate tokens, charge first payment |
| `charge_subscription` | Recurring charge using PDA delegation |
| `cancel_subscription` | Revoke delegation, close account, refund rent |
| `update_subscription` | Modify amount, interval, or expiry |

## Resources

- [Example 03 README](../../app/app/examples/03-subscription-service/README.md) - Full implementation details
- [Example 03 Source Code](../../app/app/examples/03-subscription-service)
- [Anchor Program Source](../../program/subscription-program)
- [Live Demo](https://lazorkit-cookbook.vercel.app/examples/03-subscription-service)
- [SPL Token Delegation Docs](https://spl.solana.com/token#authority-delegation)
