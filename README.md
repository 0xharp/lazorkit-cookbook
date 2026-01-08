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

## Examples

| # | Example | Description | Difficulty |
|---|---------|-------------|------------|
| 01 | [Passkey Wallet Basics](examples/01-passkey-wallet-basics) | Create wallets with Face ID, check balances | Beginner |
| 02 | [Gasless USDC Transfer](examples/02-gasless-transfer) | Send tokens without paying gas fees | Intermediate |
| 03 | [Subscription Service](examples/03-subscription-service) | Automated recurring USDC payments | Advanced |
| 04 | [Gasless Raydium Swap](examples/04-gasless-raydium-swap) | DEX token swaps without gas fees | Advanced |
| 05 | [Wallet Adapters](examples/05-wallet-adapter-integration) | LazorKit with Anza, ConnectorKit, Jupiter | Advanced |
| 06 | [NFT Minting](examples/06-nft-minting) | Standard Metaplex NFTs | Intermediate |
| 07 | [Compressed NFT](examples/07-compressed-nft-minting) | Truly gasless cNFT minting | Advanced |
| 08 | [Marinade Staking](examples/08-marinade-staking) | Liquid staking with Marinade Finance | Advanced |

**Anchor Program**: [Subscription program documentation](program/subscription-program/README.md)

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

For detailed setup instructions, see [Getting Started](docs/getting-started.md).

> **Windows Users**: The root `examples/` symlink may not work automatically. If needed, run as Administrator:
> ```cmd
> mklink /D examples app\app\examples
> ```
> Or enable Developer Mode in Windows Settings to allow symlinks without admin rights.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Installation and first integration |
| [LazorKit Basics](docs/lazorkit-basics.md) | Core concepts and patterns |
| [Wallet Adapters](docs/wallet-adapters.md) | Multi-wallet support |
| [Protocol Integrations](docs/protocol-integrations/README.md) | Raydium, Metaplex, Marinade |
| [Utilities Reference](docs/utilities-reference.md) | Hooks and utility API |

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
