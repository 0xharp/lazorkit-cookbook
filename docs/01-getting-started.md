# Getting Started

Get up and running with the LazorKit Cookbook in 5 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/0xharp/lazorkit-cookbook.git
cd lazorkit-cookbook
```

**2. Install dependencies**

```bash
cd app
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**4. Start the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the examples.

## Your First LazorKit Integration

### Step 1: Set Up the Provider

Wrap your app with the LazorKit provider in your root layout:

```typescript
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: 'https://kora.devnet.lazorkit.com'
      }}
    >
      {children}
    </LazorkitProvider>
  );
}
```

### Step 2: Create a Connect Button

This cookbook provides a wrapper hook `useLazorkitWalletConnect` that adds popup blocker detection and loading states on top of LazorKit's native `useWallet()`. You can use either approach:

**Using our wrapper (recommended for this cookbook):**

```typescript
'use client';

import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

export default function WalletPage() {
  const { wallet, isConnected, connect, connecting } = useLazorkitWalletConnect();

  if (isConnected && wallet) {
    return <p>Connected: {wallet.smartWallet}</p>;
  }

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? 'Creating Wallet...' : 'Create Wallet with Passkey'}
    </button>
  );
}
```

**Or using LazorKit's native hook directly:**

```typescript
import { useWallet } from '@lazorkit/wallet';

const { wallet, isConnected, connect, signAndSendTransaction } = useWallet();
```

When clicked, users authenticate with Face ID or Touch ID - no seed phrases, no extensions!

### Step 3: Send a Gasless Transaction

```typescript
const { signAndSendTransaction } = useLazorkitWalletConnect();

const handleTransfer = async () => {
  const instructions = await buildUsdcTransferInstructions(
    connection,
    new PublicKey(wallet.smartWallet),
    recipientAddress,
    10 // 10 USDC
  );

  const signature = await signAndSendTransaction({
    instructions,
    transactionOptions: { computeUnitLimit: 200_000 }
  });

  console.log('Transfer complete! Signature:', signature);
};
```

The user pays $0 in gas fees - the LazorKit paymaster covers everything.

## Explore the Examples

| Example | What It Demonstrates |
|---------|---------------------|
| 01 - Passkey Wallet | Wallet creation and connection |
| 02 - Gasless Transfer | Sending tokens without gas |
| 03 - Subscription Service | Recurring payments |
| 04 - Raydium Swap | DEX integration |
| 05 - Wallet Adapters | Multi-wallet support |
| 06 - NFT Minting | Metaplex integration |
| 07 - Compressed NFTs | Bubblegum cNFTs |
| 08 - Marinade Staking | DeFi integration |

## Next Steps

- [LazorKit Basics](02-lazorkit-basics.md) - Understand what the SDK provides natively
- [Cookbook Patterns](03-cookbook-patterns.md) - Learn the patterns we built and how to adopt them
- [Solana Protocols](04-solana-protocols/README.md) - Integrate with Raydium, Metaplex, Marinade
- [Custom Programs](05-custom-programs/README.md) - Build your own Anchor programs
- [Utilities Reference](07-utilities-reference.md) - API documentation for hooks and helpers

## Resources

- [LazorKit SDK Docs](https://docs.lazorkit.com)
- [Live Demo](https://lazorkit-cookbook.vercel.app)
