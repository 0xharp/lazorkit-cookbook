# Custom Solana Program Integration

This section demonstrates how LazorKit integrates with custom Anchor programs, showcasing that LazorKit works seamlessly with any Solana program - not just existing protocols.

## Why Custom Programs?

While integrating with existing protocols (Raydium, Metaplex, Marinade) demonstrates LazorKit's compatibility with the Solana ecosystem, building a custom program shows:

- **Full flexibility** - Any on-chain logic can be gasless with LazorKit
- **Complex use cases** - Features that don't exist in any protocol yet
- **Real-world patterns** - Production-ready architecture you can adapt

## The Subscription Service

We built a complete **blockchain-native subscription billing system** from scratch to demonstrate LazorKit's capabilities with custom Anchor programs.

### What It Does

| Feature | Description |
|---------|-------------|
| **One-click Subscribe** | Users authenticate once with Face ID to start a subscription |
| **Automatic Charging** | Backend charges users automatically each billing cycle |
| **Instant Cancellation** | Users can cancel anytime with rent refunded |
| **Gasless Everything** | Subscribe and cancel operations are gasless |

This is exactly like Netflix or Spotify billing - but on Solana, with LazorKit providing the seamless UX.

### The Innovation: Token Delegation

The key insight is using Solana's token delegation feature:

1. User subscribes and delegates spending permission to the subscription PDA
2. The merchant backend can now charge automatically without requiring signatures
3. User only authenticates once - all future charges happen automatically

```typescript
// During subscription, user delegates tokens to the PDA
const delegateIx = createApproveInstruction(
  userTokenAccount,
  subscriptionPDA,    // PDA becomes delegate
  userWallet,
  delegationAmount
);
```

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │  Anchor Program │     │    Backend      │
│  + LazorKit     │────▶│   On-Chain      │◀────│  Charging Job   │
│                 │     │                 │     │                 │
│ - Subscribe UI  │     │ - Subscription  │     │ - Scans PDAs    │
│ - Cancel UI     │     │   state storage │     │ - Charges due   │
│ - Dashboard     │     │ - Delegation    │     │   subscriptions │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### LazorKit Benefits for Custom Programs

| Benefit | How It Helps |
|---------|--------------|
| **Gasless Subscribe** | Users start subscriptions without paying gas |
| **Gasless Cancel** | Users cancel without paying gas |
| **Face ID Auth** | Simple authentication, no seed phrases |
| **Smart Wallet** | Persistent address for stable PDA derivation |

## Building Your Own Custom Program

The pattern for integrating any custom Anchor program with LazorKit:

```typescript
// 1. Build your program instructions
const instruction = await program.methods
  .yourInstruction(params)
  .accounts({
    user: new PublicKey(wallet.smartWallet),
    // ... other accounts
  })
  .instruction();

// 2. Send gasless via LazorKit
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: { computeUnitLimit: 600_000 }
});
```

No `processInstructionsForLazorKit` needed for custom programs since you control the instruction building and can include the smart wallet in accounts directly.

## Tutorial

- [Subscription Service Tutorial](01-subscription-service.md) - Complete walkthrough of the subscription billing system

## Source Code

- [Anchor Program](../../program/subscription-program) - The on-chain Rust program
- [Frontend Example](../../app/app/examples/03-subscription-service) - Next.js integration
- [Live Demo](https://lazorkit-cookbook.vercel.app/examples/03-subscription-service)
