# LazorKit Cookbook

**Practical examples for building Solana dApps with LazorKit SDK**

A collection of working examples demonstrating how LazorKit simplifies Solana development - from basic passkey authentication to advanced DeFi integrations with gasless transactions. **Now with React Native mobile support!**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lazorkit-cookbook.vercel.app/)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-blueviolet)](https://explorer.solana.com/?cluster=devnet)
[![LazorKit](https://img.shields.io/badge/LazorKit-v2.0.1-blue)](https://docs.lazorkit.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Why LazorKit?

| Traditional Solana UX | With LazorKit |
|----------------------|---------------|
| Seed phrases required | Face ID / Touch ID authentication |
| Browser extensions needed | Works directly in browser or mobile app |
| Users must buy SOL for gas | Gasless transactions via paymaster |
| Complex wallet setup | One-click wallet creation |

---

## Platforms

| Platform | Directory | SDK | Description |
|----------|-----------|-----|-------------|
| **Web** | [`/web`](./web) | `@lazorkit/wallet` | Next.js 16 app with 8 examples |
| **Mobile** | [`/mobile`](./mobile) | `@lazorkit/wallet-mobile-adapter` | Expo app with 3 examples |

---

## Web Examples

| # | Example | Description | Docs |
|---|---------|-------------|------|
| 01 | [Passkey Wallet Basics](web/app/examples/01-passkey-wallet-basics) | Create wallets with Face ID, check balances | [Getting Started](docs/web/01-getting-started.md) |
| 02 | [Gasless USDC Transfer](web/app/examples/02-gasless-transfer) | Send tokens without paying gas fees | [Getting Started](docs/web/01-getting-started.md) |
| 03 | [Subscription Service](web/app/examples/03-subscription-service) | Automated recurring USDC payments | [Custom Programs](docs/web/05-custom-programs/README.md) |
| 04 | [Gasless Raydium Swap](web/app/examples/04-gasless-raydium-swap) | DEX token swaps without gas fees | [Raydium Tutorial](docs/web/04-solana-protocols/01-raydium-swap.md) |
| 05 | [Wallet Adapters](web/app/examples/05-wallet-adapter-integration) | LazorKit with Anza, ConnectorKit, Jupiter | [Wallet Adapters](docs/web/06-wallet-adapters.md) |
| 06 | [NFT Minting](web/app/examples/06-nft-minting) | Standard Metaplex NFTs | [Metaplex Tutorial](docs/web/04-solana-protocols/02-metaplex-nft.md) |
| 07 | [Compressed NFT](web/app/examples/07-compressed-nft-minting) | Truly gasless cNFT minting | [Metaplex Tutorial](docs/web/04-solana-protocols/02-metaplex-nft.md) |
| 08 | [Marinade Staking](web/app/examples/08-marinade-staking) | Liquid staking with Marinade Finance | [Marinade Tutorial](docs/web/04-solana-protocols/03-marinade-staking.md) |

## Mobile Examples (React Native / Expo)

| # | Example | Description | Docs |
|---|---------|-------------|------|
| 01 | [Connect Wallet](mobile/app/examples/01-connect-wallet) | Passkey auth with deep linking | [Mobile Docs](docs/mobile/04-connect-wallet.md) |
| 02 | [Gasless Transfer](mobile/app/examples/02-gasless-transfer) | USDC transfers without gas fees | [Mobile Docs](docs/mobile/05-gasless-transfer.md) |
| 03 | [Raydium Swap](mobile/app/examples/03-raydium-swap) | DEX swaps powered by Raydium | [Mobile Docs](docs/mobile/06-raydium-swap.md) |

---

## Quick Start

### Web (Next.js)

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go or run on simulator.

---

## Documentation

This cookbook has **three layers of documentation**:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Tutorials** | [`/docs/web/`](docs/web/) & [`/docs/mobile/`](docs/mobile/) | Conceptual guides: LazorKit SDK basics, cookbook patterns, integration strategies |
| **Example Recipes** | Each example folder | Step-by-step walkthroughs with complete code (e.g., [`web/app/examples/01-passkey-wallet-basics/README.md`](web/app/examples/01-passkey-wallet-basics/README.md)) |
| **Quick Reference** | [`/examples/`](examples/) | Index linking to all examples across web and mobile |

**Start here:** [docs/README.md](docs/README.md)

---

## Project Structure

```
lazorkit-cookbook/
├── web/                    # Next.js web app
│   ├── app/examples/       # 8 web examples (each with detailed README)
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
├── mobile/                 # Expo mobile app
│   ├── app/examples/       # 3 mobile examples (each with detailed README)
│   ├── hooks/              # Mobile hooks
│   └── lib/                # Shared utilities
├── docs/                   # Tutorial documentation
│   ├── web/                # Web conceptual guides & patterns
│   └── mobile/             # Mobile conceptual guides & patterns
├── examples/               # Quick reference index
└── program/                # Anchor subscription program
```

> **Note on Code Sharing:** The `/web/lib` and `/mobile/lib` directories contain similar utilities (e.g., `solana-utils.ts`, `lazorkit-utils.ts`). This is intentional - each platform is self-contained so you can copy the code directly into your project without dependencies on a shared package.

## Live Demo

**[https://lazorkit-cookbook.vercel.app/](https://lazorkit-cookbook.vercel.app/)**

**Testing on Devnet:**
1. Create a wallet using Face ID/Touch ID
2. Get devnet SOL from [Solana Faucet](https://faucet.solana.com)
3. Get devnet USDC from [Circle Faucet](https://faucet.circle.com)
4. Try the examples

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Web Framework | Next.js 16, React 19 |
| Mobile Framework | Expo 54, React Native |
| Styling | Tailwind CSS 4 (web), StyleSheet (mobile) |
| Blockchain | Solana (Devnet) |
| Wallet SDK | LazorKit 2.0.1 |
| Smart Contracts | Anchor 0.31.1 |

---

## Bounty Submission

Created for the [Superteam x LazorKit Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux).

**Deliverables:**
- 8 web examples + 3 mobile examples with tutorials
- Live demo on Solana Devnet
- Custom Anchor subscription program
- Protocol integrations: Raydium, Metaplex, Marinade
- Wallet adapter examples: Anza, ConnectorKit, Wallet-UI, Jupiter
- **React Native mobile SDK integration**

---

## Author

**0xharp** - [@0xharp](https://twitter.com/0xharp) | [GitHub](https://github.com/0xharp)

---

## License

MIT License - feel free to use this as a starting point for your own projects.
