# Recipe 03: Subscription Service

**Build blockchain-native recurring payments - like Netflix/Spotify, but on Solana**

This advanced recipe demonstrates how to create a complete subscription billing system on Solana. Users authorize automatic USDC payments, and your backend charges them periodically - all without requiring user interaction after the initial signup.

> **Environment**: Next.js 16 + React 19. See [next.config.ts](../../next.config.ts) for required polyfills.

---

## What You'll Learn

- Implement token delegation for automatic charging
- Build a custom Anchor program for subscriptions
- Create subscription management UI (subscribe, view, cancel)
- Build a backend service for recurring charges
- Handle the complete subscription lifecycle

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUBSCRIPTION FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │   User UI   │───▶│  LazorKit    │───▶│  Solana Program (Anchor)│ │
│  │  (Next.js)  │    │  (Gasless)   │    │  - Initialize Sub       │ │
│  └─────────────┘    └──────────────┘    │  - Cancel Sub           │ │
│                                          └─────────────────────────┘ │
│                                                      ▲                │
│                                                      │                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Backend Job (API Route)                    │    │
│  │  - Scans all subscriptions on-chain                          │    │
│  │  - Charges due subscriptions automatically                   │    │
│  │  - No user signature required (uses token delegation)        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Token Delegation
When a user subscribes, they delegate their USDC token account to the subscription PDA (Program Derived Address). This allows the program to transfer tokens on their behalf without requiring a new signature each time.

```rust
// In the Anchor program
let delegate_ix = token_instruction::approve(
    &ctx.accounts.token_program.key(),
    &ctx.accounts.user_token_account.key(),
    &ctx.accounts.subscription.key(),  // PDA becomes delegate
    &ctx.accounts.authority.key(),
    &[],
    u64::MAX,  // Unlimited delegation
)?;
```

### Program Derived Addresses (PDAs)
Each subscription is stored in a unique PDA derived from:
- The word "subscription"
- User's wallet address
- Merchant's wallet address

```typescript
const [subscriptionPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('subscription'),
    userWallet.toBuffer(),
    merchantWallet.toBuffer(),
  ],
  SUBSCRIPTION_PROGRAM_ID
);
```

### Prepaid Model
Our subscription uses a **prepaid model**:
1. First payment is charged immediately on subscription
2. `last_charge_timestamp` is set to the current time
3. Next charge occurs after `interval_seconds` has passed

---

## Prerequisites

- Completed [Recipe 01](../01-passkey-wallet-basics/README.md) and [Recipe 02](../02-gasless-transfer/README.md)
- Understanding of Solana PDAs and SPL tokens
- (Optional) Anchor framework knowledge for program modifications

---

## Project Structure

```
03-subscription-service/
├── subscribe/
│   └── page.tsx          # Plan selection & subscription creation
├── dashboard/
│   └── page.tsx          # Subscription management UI
└── README.md             # This tutorial

# Related files in the app:
lib/
├── constants.ts          # Subscription plans configuration
└── program/
    └── subscription-service.ts  # On-chain program helpers

api/
└── charge-subscriptions/
    └── route.ts          # Backend charging job
```

---

## Step 1: Define Subscription Plans

The subscription plans are defined in a configuration file with price, interval, and features.

**Plan Structure:**

```typescript
export interface PlanFeatures {
  id: string;
  name: string;
  price: number;           // in USDC
  interval: number;        // in seconds (e.g., 2592000 for 30 days)
  features: string[];
}
```

**Available Plans:**
| Plan | Price | Interval | Use Case |
|------|-------|----------|----------|
| Test | $0.01 | 1 minute | Development testing |
| Basic | $0.10 | 30 days | Standard subscription |
| Pro | $0.20 | 30 days | Premium features |

> **Source**: See the full plan configuration at [`constants.ts`](../../lib/constants.ts)

---

## Step 2: Build the Program Helpers

The helper library provides functions to interact with the Anchor program.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getSubscriptionPDA()` | Derives subscription account address from user + merchant |
| `buildInitializeSubscriptionIx()` | Builds instruction to create subscription and charge first payment |
| `buildCancelSubscriptionIx()` | Builds instruction to cancel and revoke delegation |
| `hasActiveSubscription()` | Checks if user has an active subscription |

**PDA Derivation:**

```typescript
// Each user has one subscription per merchant
const [subscriptionPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('subscription'),
    userWallet.toBuffer(),
    merchantWallet.toBuffer(),
  ],
  SUBSCRIPTION_PROGRAM_ID
);
```

> **Source**: See the full helper library at [`subscription-service.ts`](../../lib/program/subscription-service.ts)

---

## Step 3: Create the Subscribe Page

The subscribe page displays available plans and handles the subscription creation flow using centralized hooks.

**Key Pattern - Creating a Subscription:**

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { getConnection } from '@/lib/solana-utils';

export default function SubscribePage() {
  const { wallet, isConnected, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();

  const handleSubscribe = async (plan: PlanFeatures) => {
    const connection = getConnection();

    // Build subscription instructions
    const instructions = await buildInitializeSubscriptionIx({
      userWallet,
      amountPerPeriod: plan.price,
      intervalSeconds: plan.interval,
      expiresAt,
    }, connection);

    // Send gasless transaction - first payment charged immediately
    const signature = await signAndSendTransaction({
      instructions,
      transactionOptions: { computeUnitLimit: 600_000 }
    });
  };
}
```

> **Source**: See the full subscribe page at [`subscribe/page.tsx`](subscribe/page.tsx)

---

## Step 4: Create the Dashboard Page

The dashboard displays subscription details and allows cancellation.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `loadSubscription()` | Fetches and parses subscription data from on-chain PDA |
| `handleCancel()` | Cancels subscription, revokes delegation, refunds rent |
| `getNextChargeDate()` | Calculates next charge date from last charge + interval |

**Key Pattern - Cancelling a Subscription:**

```typescript
const handleCancel = async () => {
  const instruction = await buildCancelSubscriptionIx(userWallet);

  // Gasless cancellation - revokes delegation and refunds rent
  const signature = await signAndSendTransaction({
    instructions: [instruction],
    transactionOptions: { computeUnitLimit: 600_000 }
  });
};
```

> **Source**: See the full dashboard at [`dashboard/page.tsx`](dashboard/page.tsx)

---

## Step 5: Build the Backend Charging Job

The backend API route scans all subscriptions and charges those that are due.

**How It Works:**

1. Fetches all subscription accounts using `getProgramAccounts()`
2. For each subscription, parses the on-chain data to check:
   - Is subscription active?
   - Has enough time passed since last charge?
3. Builds and sends charge transaction (no user signature needed - uses token delegation)
4. Returns summary of charged, skipped, and errored subscriptions

**Key Functions:**

| Function | Description |
|----------|-------------|
| `checkRateLimit()` | Prevents abuse with in-memory rate limiting |
| `buildChargeInstruction()` | Creates the `charge_subscription` instruction |
| `POST()` | Main handler - scans and charges due subscriptions |

**Charge Flow (no user signature needed):**

```typescript
// PDA can transfer tokens because user delegated on subscribe
const instruction = buildChargeInstruction(
  subscriptionPDA,
  userTokenAccount,
  recipientTokenAccount,
  programId
);

// Merchant pays gas, but token transfer uses PDA delegation
const signature = await sendAndConfirmTransaction(
  connection, transaction, [merchantKeypair]
);
```

> **Source**: See the full API route at [`api/charge-subscriptions/route.ts`](../../api/charge-subscriptions/route.ts)

---

## Anchor Program Overview

The subscription is powered by a custom Anchor program with the following key instructions:

| Instruction | Description |
|-------------|-------------|
| `initialize_subscription` | Creates subscription, delegates token account, charges first payment |
| `charge_subscription` | Recurring charge using PDA delegation (no user signature) |
| `cancel_subscription` | Revokes delegation, closes account, refunds rent |
| `update_subscription` | Updates amount, interval, or expiry |

> **Full Documentation**: See the [Anchor Program README](../../../../program/subscription-program/README.md) for complete implementation details, account structures, and security considerations.

---

## Testing the Flow

1. **Create a subscription** (Test Plan - $0.01/minute):
   - Go to `/examples/03-subscription-service/subscribe`
   - Select "Test Plan"
   - Click Subscribe
   - First payment charged immediately

2. **View your subscription**:
   - Go to `/examples/03-subscription-service/dashboard`
   - See plan details, last charge, next charge date

3. **Trigger recurring charge** (after 1 minute):
   - On the dashboard, click "Trigger Payment Processing"
   - The backend scans all subscriptions
   - Charges those that are due

4. **Cancel subscription**:
   - Click "Cancel Subscription"
   - Setup fee refunded (~0.002 SOL)
   - Token delegation revoked

---

## Production Considerations

This is a proof-of-concept. For production:

| Area | Recommendation |
|------|----------------|
| **Backend** | Use scheduled jobs (cron) instead of manual triggers |
| **Security** | Store merchant keypair in secure vault (AWS KMS, etc.) |
| **Paymaster** | Work with LazorKit to cover PDA rent fees |
| **Monitoring** | Add logging, alerts for failed charges |
| **User Notifications** | Email/push before charges, on failures |

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/03-subscription-service](https://lazorkit-cookbook.vercel.app/examples/03-subscription-service)

---

## Next Steps

- Explore the [Anchor Program Documentation](../../../../program/subscription-program/README.md)
- Try [Recipe 04: Gasless Raydium Swap](../04-gasless-raydium-swap/README.md) - DEX integration!
- Learn about [LazorKit SDK](https://docs.lazorkit.com/)
- Build your own subscription-based dApp!

---

## Resources

- [Anchor Framework](https://www.anchor-lang.com/docs)
- [SPL Token Delegation](https://spl.solana.com/token#authority-delegation)
- [Solana PDAs Explained](https://solanacookbook.com/core-concepts/pdas.html)
