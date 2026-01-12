# LazorKit Cookbook Documentation

Welcome to the LazorKit Cookbook! This collection of tutorials shows you how to build seamless Solana dApps using LazorKit's passkey authentication and gasless transaction infrastructure.

## Choose Your Platform

| Platform | SDK | Examples |
|----------|-----|----------|
| **[Web (Next.js)](./web/)** | `@lazorkit/wallet` | 8 examples including NFT minting, DEX swaps, staking |
| **[Mobile (React Native / Expo)](./mobile/)** | `@lazorkit/wallet-mobile-adapter` | 3 examples: connect, transfer, swap |

## What You'll Learn

This cookbook demonstrates how to:

1. **Set up LazorKit** - Initialize the SDK and create passkey-based wallets
2. **Build gasless experiences** - Send tokens, swap on DEXs, mint NFTs - all without users paying gas
3. **Integrate with Solana protocols** - Connect LazorKit with Raydium, Metaplex, Marinade
4. **Build custom programs** - Create your own Anchor programs that work with LazorKit
5. **Support multiple wallets** - Use LazorKit alongside Phantom, Solflare, and other wallets

---

## Web Documentation

| Guide | Description |
|-------|-------------|
| [01 - Getting Started](./web/01-getting-started.md) | Set up your environment and run your first example |
| [02 - LazorKit Basics](./web/02-lazorkit-basics.md) | What the LazorKit SDK provides natively |
| [03 - Cookbook Patterns](./web/03-cookbook-patterns.md) | Reusable patterns for protocol integrations |
| [04 - Solana Protocols](./web/04-solana-protocols/README.md) | Integrate with Raydium, Metaplex, Marinade |
| [05 - Custom Programs](./web/05-custom-programs/README.md) | Build custom Anchor programs with LazorKit |
| [06 - Wallet Adapters](./web/06-wallet-adapters.md) | Multi-wallet support with LazorKit |
| [07 - Utilities Reference](./web/07-utilities-reference.md) | API reference for hooks and helpers |

### Web Examples

| # | Example | Description |
|---|---------|-------------|
| 01 | [Passkey Wallet](../web/app/examples/01-passkey-wallet-basics) | One-click wallet creation with Face ID/Touch ID |
| 02 | [Gasless Transfer](../web/app/examples/02-gasless-transfer) | Send USDC without gas fees |
| 03 | [Subscription Service](../web/app/examples/03-subscription-service) | Automated recurring payments |
| 04 | [Raydium Swap](../web/app/examples/04-gasless-raydium-swap) | Gasless DEX trading |
| 05 | [Wallet Adapters](../web/app/examples/05-wallet-adapter-integration) | Multi-wallet dApp |
| 06 | [NFT Minting](../web/app/examples/06-nft-minting) | Mint Metaplex NFTs |
| 07 | [Compressed NFTs](../web/app/examples/07-compressed-nft-minting) | Mint cNFTs with Bubblegum |
| 08 | [Marinade Staking](../web/app/examples/08-marinade-staking) | Liquid staking integration |

---

## Mobile Documentation

| Guide                                                    | Description |
|----------------------------------------------------------|-------------|
| [01 - Getting Started](./mobile/01-getting-started.md)   | Expo setup, polyfills, deep linking |
| [02 - LazorKit Basics](./mobile/02-lazorkit-basics.md)   | What the LazorKit SDK provides natively |
| [03 - Cookbook Patterns](./mobile/03-cookbook-patterns.md) | Reusable patterns  |
| [04 - Connect Wallet](./mobile/04-connect-wallet.md)     | Passkey auth with deep links |
| [05 - Gasless Transfer](./mobile/05-gasless-transfer.md) | USDC transfers on mobile |
| [06 - Raydium Swap](./mobile/06-raydium-swap.md)         | DEX swaps with Raydium API |

### Mobile Examples

| # | Example                                                            | Description |
|---|-------------------------------------------------------------------|-------------|
| 01 | [Connect Wallet](../mobile/app/examples/01-connect-wallet)        | Passkey authentication with deep linking |
| 02 | [Gasless Transfer](../mobile/app/examples/02-gasless-transfer)    | USDC transfers without gas fees |
| 03 | [Raydium Swap](../mobile/app/examples/03-raydium-swap)            | DEX swaps powered by Raydium |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your dApp                               │
├─────────────────────────────────────────────────────────────┤
│  COOKBOOK PATTERNS (copy these!)                            │
│  ├─ Hooks: useLazorkitWallet, useBalances                   │
│  └─ Utils: processInstructionsForLazorKit                   │
├─────────────────────────────────────────────────────────────┤
│  LazorKit SDK                                               │
│  ├─ Web: @lazorkit/wallet                                   │
│  └─ Mobile: @lazorkit/wallet-mobile-adapter                 │
├─────────────────────────────────────────────────────────────┤
│                      Solana                                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Links

- [LazorKit SDK Docs](https://docs.lazorkit.com)
- [GitHub Repository](https://github.com/0xharp/lazorkit-cookbook)
