# Getting Started

This guide walks you through setting up the LazorKit Cookbook and running your first example.

## Prerequisites

- Node.js 18+
- npm or yarn
- Basic understanding of React and Next.js

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-repo/lazorkit-cookbook.git
cd lazorkit-cookbook
```

2. **Install dependencies**

```bash
cd app
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID=3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v
NEXT_PUBLIC_MERCHANT_WALLET=CRZUdacW3tzgDvPiEPeiXCsNzVtSBCgztuUwPwNz1JYv
```

4. **Start the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the cookbook.

## Your First Integration

The simplest integration is Example 01: Passkey Wallet Basics.

### 1. Set Up the Provider

Wrap your app with the LazorKit provider:

```typescript
// providers/LazorkitProvider.tsx
'use client';

import { LazorkitProvider as LazorkitWalletProvider } from '@lazorkit/wallet';

export function LazorkitProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitWalletProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: 'https://kora.devnet.lazorkit.com'
      }}
    >
      {children}
    </LazorkitWalletProvider>
  );
}
```

### 2. Use the Wallet Hook

```typescript
'use client';

import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

export default function WalletPage() {
  const { wallet, isConnected, connect, connecting } = useLazorkitWalletConnect();

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? 'Creating Wallet...' : 'Create Wallet with Passkey'}
    </button>
  );
}
```

### 3. Access the Wallet

Once connected, the wallet address is available via `wallet.smartWallet`:

```typescript
{isConnected && wallet && (
  <p>Wallet Address: {wallet.smartWallet}</p>
)}
```

## Next Steps

- [LazorKit Basics](lazorkit-basics.md) - Learn core concepts and patterns
- [Example 02: Gasless Transfer](../examples/02-gasless-transfer/README.md) - Send tokens without gas fees
- [Utilities Reference](utilities-reference.md) - Explore available hooks and utilities

## Getting Help

- Check the [example READMEs](../examples) for detailed tutorials
- Review the [utilities reference](utilities-reference.md) for API documentation
- Visit [LazorKit Docs](https://docs.lazorkit.com) for SDK documentation
