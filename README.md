# LazorKit Cookbook

**Practical examples for building Solana dApps with LazorKit SDK**

A collection of working examples demonstrating how LazorKit simplifies Solana development - from basic passkey authentication to advanced DeFi integrations with gasless transactions.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lazorkit-cookbook.vercel.app/)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-blueviolet)](https://explorer.solana.com/?cluster=devnet)
[![LazorKit](https://img.shields.io/badge/LazorKit-v2.0.1-blue)](https://docs.lazorkit.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Why LazorKit?

| Traditional Solana UX | With LazorKit |
|----------------------|---------------|
| Seed phrases required | Face ID / Touch ID authentication |
| Browser extensions needed | Works directly in browser |
| Users must buy SOL for gas | Gasless transactions via paymaster |
| Complex wallet setup | One-click wallet creation |

---

## How This Cookbook Is Organized

This cookbook has two main parts:

### Examples (`/examples`)
Working code implementations you can run and explore. The `/examples` directory at the root provides quick access to all examples (the actual implementations live in `app/app/examples/`). Each example has its own README with:
- What it demonstrates
- How to run it
- Key code snippets
- Implementation details

### Documentation (`/docs`)
Step-by-step tutorials for integrating LazorKit into your own projects:
- [Tutorials](docs/README.md) - Guides that walk you through building features
- [Cookbook Patterns](docs/03-cookbook-patterns.md) - Reusable patterns we created that you can adopt
- [API Reference](docs/07-utilities-reference.md) - Documentation for hooks and utilities

**The relationship**: Examples show the complete working code, while docs explain the concepts and patterns behind them. Use examples as reference implementations and docs as learning guides.

---

## Examples

| # | Example | Description | Docs |
|---|---------|-------------|------|
| 01 | [Passkey Wallet Basics](examples/01-passkey-wallet-basics) | Create wallets with Face ID, check balances | [Getting Started](docs/01-getting-started.md) |
| 02 | [Gasless USDC Transfer](examples/02-gasless-transfer) | Send tokens without paying gas fees | [Getting Started](docs/01-getting-started.md) |
| 03 | [Subscription Service](examples/03-subscription-service) | Automated recurring USDC payments | [Custom Programs](docs/05-custom-programs/README.md) |
| 04 | [Gasless Raydium Swap](examples/04-gasless-raydium-swap) | DEX token swaps without gas fees | [Raydium Tutorial](docs/04-solana-protocols/01-raydium-swap.md) |
| 05 | [Wallet Adapters](examples/05-wallet-adapter-integration) | LazorKit with Anza, ConnectorKit, Jupiter | [Wallet Adapters](docs/06-wallet-adapters.md) |
| 06 | [NFT Minting](examples/06-nft-minting) | Standard Metaplex NFTs | [Metaplex Tutorial](docs/04-solana-protocols/02-metaplex-nft.md) |
| 07 | [Compressed NFT](examples/07-compressed-nft-minting) | Truly gasless cNFT minting | [Metaplex Tutorial](docs/04-solana-protocols/02-metaplex-nft.md) |
| 08 | [Marinade Staking](examples/08-marinade-staking) | Liquid staking with Marinade Finance | [Marinade Tutorial](docs/04-solana-protocols/03-marinade-staking.md) |

Each example has a detailed README - click on the example name to view it.

**Anchor Program**: [Subscription program documentation](program/subscription-program/README.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/01-getting-started.md) | Installation and first integration |
| [LazorKit Basics](docs/02-lazorkit-basics.md) | What the SDK provides natively |
| [Cookbook Patterns](docs/03-cookbook-patterns.md) | Reusable patterns we built |
| [Solana Protocols](docs/04-solana-protocols/README.md) | Raydium, Metaplex, Marinade integrations |
| [Custom Programs](docs/05-custom-programs/README.md) | Building with custom Anchor programs |
| [Wallet Adapters](docs/06-wallet-adapters.md) | Multi-wallet support |
| [Utilities Reference](docs/07-utilities-reference.md) | Hooks and utility API |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/0xharp/lazorkit-cookbook.git
cd lazorkit-cookbook/app
npm install

# Configure environment
cp env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [Getting Started](docs/01-getting-started.md).

---

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
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Blockchain | Solana (Devnet) |
| Wallet SDK | LazorKit 2.0.1 |
| Smart Contracts | Anchor 0.31.1 |

---

## Bounty Submission

Created for the [Superteam x LazorKit Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux).

**Deliverables:**
- 8 working examples with tutorials
- Live demo on Solana Devnet
- Custom Anchor subscription program
- Protocol integrations: Raydium, Metaplex, Marinade
- Wallet adapter examples: Anza, ConnectorKit, Wallet-UI, Jupiter

---

## Author

**0xharp** - [@0xharp](https://twitter.com/0xharp) | [GitHub](https://github.com/0xharp)

---

## License

MIT License - feel free to use this as a starting point for your own projects.
