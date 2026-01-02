# LazorKit Cookbook

**Practical recipes for building Solana dApps with LazorKit SDK**

A collection of practical examples demonstrating how LazorKit simplifies Solana development - from basic passkey authentication to advanced subscription billing systems with automated recurring payments.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lazorkit-cookbook.vercel.app/)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-blueviolet)](https://explorer.solana.com/?cluster=devnet)
[![LazorKit](https://img.shields.io/badge/LazorKit-v2.0.1-blue)](https://docs.lazorkit.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is LazorKit?

LazorKit is an open-source Passkey wallet SDK for Solana that eliminates the biggest barriers to blockchain adoption:

| Traditional Solana UX | With LazorKit |
|----------------------|---------------|
| Seed phrases required | Face ID / Touch ID authentication |
| Browser extensions needed | Works directly in browser |
| Users must buy SOL for gas | Gasless transactions via paymaster |
| Complex wallet setup | One-click wallet creation |

**This cookbook demonstrates real-world integration patterns** to help developers build user-friendly Solana dApps.

---

## Why This Project?

The goal of this cookbook is to showcase how **LazorKit can be integrated with complex on-chain programs** while dramatically reducing onboarding friction for end users. Traditional blockchain applications suffer from poor UX - seed phrases, wallet extensions, and gas fees create barriers that drive users away.

This project demonstrates that you can build sophisticated Solana applications (including custom Anchor programs with token delegation and automated recurring payments) while maintaining a seamless, Web2-like user experience through LazorKit's passkey authentication and gasless transactions.

> **Note on the Subscription Program**: The custom Solana program powering Recipe 03 is currently deployed on **Devnet** and should be considered a proof-of-concept. Before deploying to Mainnet, the program should undergo a **professional security audit**. After audit completion, the **upgrade authority can be revoked** to make the program fully trustless and immutable.

---

## Recipes Overview

| Recipe | Description | Difficulty   | Tutorial |
|--------|-------------|--------------|----------|
| [01: Passkey Wallet Basics](app/app/recipes/01-passkey-wallet-basics) | Create wallets with Face ID, check balances | Beginner     | [Read Tutorial](app/app/recipes/01-passkey-wallet-basics/README.md) |
| [02: Gasless USDC Transfer](app/app/recipes/02-gasless-transfer) | Send tokens without paying gas fees | Intermediate | [Read Tutorial](app/app/recipes/02-gasless-transfer/README.md) |
| [03: Subscription Service](app/app/recipes/03-subscription-service) | Automated recurring USDC payments on Solana | Advanced     | [Read Tutorial](app/app/recipes/03-subscription-service/README.md) |
| [04: Gasless Raydium Swap](app/app/recipes/04-gasless-raydium-swap) | DEX token swaps without gas fees | Advanced     | [Read Tutorial](app/app/recipes/04-gasless-raydium-swap/README.md) |
| [05: Wallet Adapter Integration](app/app/recipes/05-wallet-adapter-integration) | Use LazorKit with Anza, ConnectorKit, Wallet-UI, Jupiter Unified Wallet | Advanced     | [Read Tutorial](app/app/recipes/05-wallet-adapter-integration/README.md) |
| [06: Regular Metaplex NFT](app/app/recipes/06-nft-minting) | Mint standard NFTs with Metaplex Token Metadata | Intermediate | [Read Tutorial](app/app/recipes/06-nft-minting/README.md) |
| [07: Gasless cNFT Minting](app/app/recipes/07-compressed-nft-minting) | Mint compressed NFTs with Bubblegum (truly gasless!) | Advanced     | [Read Tutorial](app/app/recipes/07-compressed-nft-minting/README.md) |
| [08: Liquid Staking (Marinade)](app/app/recipes/08-marinade-staking) | Stake SOL for mSOL with Marinade Finance | Advanced     | [Read Tutorial](app/app/recipes/08-marinade-staking/README.md) |

**Anchor Program**: Custom smart contract powering the subscription service. [Read Documentation](program/subscription-program/README.md)

---

## Quick Start

### Prerequisites

- **Node.js 22+** and npm/yarn/pnpm
- Basic understanding of React and Next.js
- (Optional) Solana CLI and Anchor for Recipe 03's smart contract

### Installation

```bash
# Clone the repository
git clone https://github.com/0xharp/lazorkit-cookbook.git
cd lazorkit-cookbook

# Navigate to the app directory
cd app

# Install dependencies
npm install

# NOTE: This cookbook demonstrates multiple wallet adapters that may use
# different versions of @solana/web3.js. If you encounter peer dependency
# conflicts, use:
npm install --legacy-peer-deps

# Set up environment variables
cp env.example .env.local
```

### Environment Configuration

Create `.env.local` in the `app/` directory:

```env
# Solana Network
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# LazorKit Configuration
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com

# Token Configuration (Devnet USDC)
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Recipe 03: Subscription Service
NEXT_PUBLIC_SUBSCRIPTION_PROGRAM_ID=3kZ9Fdzadk8NXwjHaSabKrXBsU1y226BgXJdHZ78Qx4v
NEXT_PUBLIC_MERCHANT_WALLET=<your_merchant_wallet_address>
MERCHANT_KEYPAIR_SECRET=<base64_encoded_keypair_json>  # For backend charging
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the cookbook homepage.

---

## Project Structure

```
lazorkit-cookbook/
├── app/                                    # Next.js 16 Application
│   ├── app/
│   │   ├── recipes/
│   │   │   ├── 01-passkey-wallet-basics/   # Recipe 01 (has README.md tutorial)
│   │   │   │   ├── page.tsx
│   │   │   │   └── README.md               # 📖 Tutorial: Passkey Wallet Basics
│   │   │   ├── 02-gasless-transfer/        # Recipe 02 (has README.md tutorial)
│   │   │   │   ├── page.tsx
│   │   │   │   └── README.md               # 📖 Tutorial: Gasless USDC Transfer
│   │   │   ├── 03-subscription-service/    # Recipe 03 (has README.md tutorial)
│   │   │   │   ├── subscribe/page.tsx      # Plan selection & subscribe
│   │   │   │   ├── dashboard/page.tsx      # Manage subscription
│   │   │   │   └── README.md               # 📖 Tutorial: Subscription Service
│   │   │   ├── 04-gasless-raydium-swap/    # Recipe 04 (has README.md tutorial)
│   │   │   │   ├── page.tsx                # DEX swap interface
│   │   │   │   └── README.md               # 📖 Tutorial: Gasless Raydium Swap
│   │   │   ├── 05-wallet-adapter-integration/  # Recipe 05 (has README.md tutorial)
│   │   │   │   ├── page.tsx                # Adapter selection page
│   │   │   │   ├── anza-adapter/page.tsx   # Anza Wallet Adapter demo
│   │   │   │   ├── connectorkit/page.tsx   # ConnectorKit demo
│   │   │   │   ├── wallet-ui/page.tsx      # Wallet-UI demo
│   │   │   │   ├── unified-wallet-kit/page.tsx  # Jupiter Unified Wallet Kit demo
│   │   │   │   └── README.md               # 📖 Tutorial: Wallet Adapter Integration
│   │   │   ├── 06-nft-minting/             # Recipe 06 (has README.md tutorial)
│   │   │   │   ├── page.tsx                # Regular NFT minting interface
│   │   │   │   └── README.md               # 📖 Tutorial: Regular Metaplex NFT
│   │   │   ├── 07-compressed-nft-minting/  # Recipe 07 (has README.md tutorial)
│   │   │   │   ├── page.tsx                # Compressed NFT minting interface
│   │   │   │   └── README.md               # 📖 Tutorial: Gasless cNFT Minting
│   │   │   └── 08-marinade-staking/        # Recipe 08 (has README.md tutorial)
│   │   │       ├── page.tsx                # Liquid staking interface
│   │   │       └── README.md               # 📖 Tutorial: Liquid Staking (Marinade)
│   │   ├── api/
│   │   │   └── charge-subscriptions/       # Backend recurring charge job
│   │   │       └── route.ts
│   │   ├── page.tsx                        # Homepage with recipe cards
│   │   └── layout.tsx                      # Root layout with providers
│   ├── components/
│   │   ├── Header.tsx                      # Navigation with wallet info
│   │   └── Footer.tsx                      # Links and attribution
│   ├── hooks/
│   │   ├── useBalances.ts                  # SOL/USDC balance fetching hook
│   │   ├── useTransferForm.ts              # Transfer form state management
│   │   └── useLazorkitWalletConnect.ts     # Wallet connection with error handling
│   ├── lib/
│   │   ├── constants.ts                    # Subscription plans & config
│   │   ├── solana-utils.ts                 # Shared Solana utilities
│   │   ├── lazorkit-utils.ts               # LazorKit integration utilities
│   │   ├── nft-utils.ts                    # NFT minting utilities (Metaplex)
│   │   └── program/
│   │       └── subscription-service.ts     # On-chain program helpers
│   ├── providers/
│   │   └── LazorkitProvider.tsx            # LazorKit SDK initialization
│   └── env.example                         # Environment template
│
├── program/                                # Solana Smart Contracts
│   └── subscription-program/
│       ├── programs/subscription-program/
│       │   └── src/lib.rs                  # Anchor program (Rust)
│       ├── Anchor.toml
│       └── README.md                       # 📖 Anchor Program Documentation
│
└── README.md                               # This file
```

### Documentation Quick Links

| Document | Description |
|----------|-------------|
| [Recipe 01 Tutorial](app/app/recipes/01-passkey-wallet-basics/README.md) | Passkey authentication & wallet basics |
| [Recipe 02 Tutorial](app/app/recipes/02-gasless-transfer/README.md) | Gasless USDC transfers with paymaster |
| [Recipe 03 Tutorial](app/app/recipes/03-subscription-service/README.md) | Subscription billing system |
| [Recipe 04 Tutorial](app/app/recipes/04-gasless-raydium-swap/README.md) | Gasless DEX swaps with Raydium |
| [Recipe 05 Tutorial](app/app/recipes/05-wallet-adapter-integration/README.md) | Wallet adapter integration |
| [Recipe 06 Tutorial](app/app/recipes/06-nft-minting/README.md) | Regular Metaplex NFT minting |
| [Recipe 07 Tutorial](app/app/recipes/07-compressed-nft-minting/README.md) | Gasless cNFT minting with Bubblegum |
| [Recipe 08 Tutorial](app/app/recipes/08-marinade-staking/README.md) | Liquid staking with Marinade Finance |
| [Anchor Program Docs](program/subscription-program/README.md) | Smart contract implementation |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.0 (App Router) |
| **React** | React 19.2.3 |
| **Styling** | Tailwind CSS 4 |
| **Blockchain** | Solana (Devnet) |
| **Wallet SDK** | LazorKit @lazorkit/wallet 2.0.1 |
| **Smart Contracts** | Anchor 0.31.1 |
| **Token Standard** | SPL Token 0.4.14 |
| **Deployment** | Vercel (frontend), Solana Devnet (contracts) |

---

## Core LazorKit Features Demonstrated

### 1. Passkey Authentication ([Recipe 01 Tutorial](app/app/recipes/01-passkey-wallet-basics/README.md))
Create wallets using WebAuthn (Face ID/Touch ID) - no seed phrases, no browser extensions.

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';

function WalletButton() {
  const { wallet, connect, isConnected, connecting } = useLazorkitWalletConnect();

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? 'Connecting...' : isConnected ? wallet?.smartWallet : 'Connect with Face ID'}
    </button>
  );
}
```

### 2. Gasless Transactions ([Recipe 02 Tutorial](app/app/recipes/02-gasless-transfer/README.md))
Send tokens without users needing SOL for gas - LazorKit's paymaster covers the fees.

```typescript
const { signAndSendTransaction } = useWallet();

// Build your instruction
const transferIx = createTransferInstruction(
  senderTokenAccount,
  recipientTokenAccount,
  senderPubkey,
  amount * 1_000_000
);

// Send gasless - paymaster covers fees
const signature = await signAndSendTransaction({
  instructions: [transferIx]
});
```

### 3. Smart Wallet Integration ([Recipe 03 Tutorial](app/app/recipes/03-subscription-service/README.md))
Integrate with custom Anchor programs for advanced use cases like recurring payments.

```typescript
const instructions = await buildInitializeSubscriptionIx({
  userWallet,
  amountPerPeriod: 0.10,  // $0.10 USDC
  intervalSeconds: 30 * 24 * 60 * 60,  // 30 days
  expiresAt: undefined  // Perpetual subscription
}, connection);

await signAndSendTransaction({ instructions });
```

> **Deep Dive**: See the [Anchor Program Documentation](program/subscription-program/README.md) for the smart contract implementation.

---

## LazorKit Provider Setup

The cookbook uses a custom provider to configure LazorKit SDK:

```typescript
// providers/LazorkitProvider.tsx
'use client';

import { LazorkitProvider as LazorkitWalletProvider } from '@lazorkit/wallet';

export function LazorkitProvider({ children }) {
  return (
    <LazorkitWalletProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      {children}
    </LazorkitWalletProvider>
  );
}
```

---

## Learning Path

| If you are... | Start with...                                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| New to Solana | [Recipe 01: Passkey Wallet Basics](app/app/recipes/01-passkey-wallet-basics/README.md) - Understand wallet basics                                                                 |
| Familiar with Solana | [Recipe 02: Gasless USDC Transfer](app/app/recipes/02-gasless-transfer/README.md) - See how LazorKit simplifies your code                                                         |
| Using existing wallets | [Recipe 05: Wallet Adapter Integration](app/app/recipes/05-wallet-adapter-integration/README.md) - Integrate LazorKit with Wallet Adapter to make it work alongside other wallets |
| DeFi enthusiast | [Recipe 04: Gasless Raydium Swap](app/app/recipes/04-gasless-raydium-swap/README.md) & [Recipe 08: Liquid Staking](app/app/recipes/08-marinade-staking/README.md) - DeFi integrations |
| NFT developer | [Recipe 06](app/app/recipes/06-nft-minting/README.md) & [Recipe 07](app/app/recipes/07-compressed-nft-minting/README.md) - Regular and compressed NFT minting                     |
| Advanced developer | [Recipe 03: Subscription Service](app/app/recipes/03-subscription-service/README.md) - Build complex on-chain programs                                                            |

**Smart Contract Developer?** Check out the [Anchor Program Documentation](program/subscription-program/README.md) for the Rust implementation.

---

## Live Demo

Visit the deployed cookbook: **[https://lazorkit-cookbook.vercel.app/](https://lazorkit-cookbook.vercel.app/)**

**Testing on Devnet:**
1. Create a wallet using Face ID/Touch ID
2. Get devnet SOL from [Solana Faucet](https://faucet.solana.com)
3. Get devnet USDC from [Circle Faucet](https://faucet.circle.com)
4. Try the gasless transfer and subscription features

---

## Resources

### Cookbook Tutorials
- [Recipe 01: Passkey Wallet Basics](app/app/recipes/01-passkey-wallet-basics/README.md)
- [Recipe 02: Gasless USDC Transfer](app/app/recipes/02-gasless-transfer/README.md)
- [Recipe 03: Subscription Service](app/app/recipes/03-subscription-service/README.md)
- [Recipe 04: Gasless Raydium Swap](app/app/recipes/04-gasless-raydium-swap/README.md)
- [Recipe 05: Wallet Adapter Integration](app/app/recipes/05-wallet-adapter-integration/README.md)
- [Recipe 06: Regular Metaplex NFT](app/app/recipes/06-nft-minting/README.md)
- [Recipe 07: Gasless cNFT Minting](app/app/recipes/07-compressed-nft-minting/README.md)
- [Recipe 08: Liquid Staking (Marinade)](app/app/recipes/08-marinade-staking/README.md)
- [Anchor Program Documentation](program/subscription-program/README.md)

### External Documentation
- **LazorKit Documentation**: [docs.lazorkit.com](https://docs.lazorkit.com/)
- **LazorKit GitHub**: [github.com/lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit)
- **Solana Documentation**: [docs.solana.com](https://docs.solana.com/)
- **Anchor Documentation**: [anchor-lang.com/docs](https://www.anchor-lang.com/docs)

---

## Bounty Submission

This cookbook was created for the [**Superteam x LazorKit Bounty**](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux).

**Deliverables:**
- Working example repository with 8 recipes
- Step-by-step tutorials for each recipe
- Live demo deployed on Solana Devnet
- Custom Anchor program for subscription billing
- Raydium DEX integration for gasless token swaps
- Wallet adapter integration examples (Anza, ConnectorKit, Wallet-UI, Jupiter Unified Wallet)
- NFT minting with Metaplex (regular and compressed)
- Marinade Finance liquid staking integration

---

## Author

**0xharp**
- Twitter: [@0xharp](https://twitter.com/0xharp)
- GitHub: [@0xharp](https://github.com/0xharp)

---

## License

MIT License - feel free to use this cookbook as a starting point for your own projects.

---

Built with LazorKit SDK for the Solana ecosystem.
