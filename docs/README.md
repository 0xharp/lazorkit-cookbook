# LazorKit Cookbook Documentation

Welcome to the LazorKit Cookbook! This collection of tutorials shows you how to build seamless Solana dApps using LazorKit's passkey authentication and gasless transaction infrastructure.

## What You'll Learn

This cookbook demonstrates how to:

1. **Set up LazorKit** - Initialize the SDK and create passkey-based wallets
2. **Build gasless experiences** - Send tokens, swap on DEXs, mint NFTs - all without users paying gas
3. **Integrate with Solana protocols** - Connect LazorKit with Raydium, Metaplex, Marinade
4. **Build custom programs** - Create your own Anchor programs that work with LazorKit
5. **Support multiple wallets** - Use LazorKit alongside Phantom, Solflare, and other popular wallets

## Documentation

| Guide | Description |
|-------|-------------|
| [01 - Getting Started](01-getting-started.md) | Set up your environment and run your first example |
| [02 - LazorKit Basics](02-lazorkit-basics.md) | What the LazorKit SDK provides natively |
| [03 - Cookbook Patterns](03-cookbook-patterns.md) | Reusable patterns we built for protocol integrations |
| [04 - Solana Protocols](04-solana-protocols/README.md) | Integrate with Raydium, Metaplex, Marinade |
| [05 - Custom Programs](05-custom-programs/README.md) | Build custom Anchor programs with LazorKit |
| [06 - Wallet Adapters](06-wallet-adapters.md) | Multi-wallet support with LazorKit |
| [07 - Utilities Reference](07-utilities-reference.md) | API reference for hooks and helpers |

## Examples

| # | Example | What You'll Build |
|---|---------|-------------------|
| 01 | [Passkey Wallet](../app/app/examples/01-passkey-wallet-basics) | One-click wallet creation with Face ID/Touch ID |
| 02 | [Gasless Transfer](../app/app/examples/02-gasless-transfer) | Send USDC without gas fees |
| 03 | [Subscription Service](../app/app/examples/03-subscription-service) | Automated recurring payments with custom Anchor program |
| 04 | [Raydium Swap](../app/app/examples/04-gasless-raydium-swap) | Gasless DEX trading |
| 05 | [Wallet Adapters](../app/app/examples/05-wallet-adapter-integration) | Multi-wallet dApp |
| 06 | [NFT Minting](../app/app/examples/06-nft-minting) | Mint Metaplex NFTs |
| 07 | [Compressed NFTs](../app/app/examples/07-compressed-nft-minting) | Mint cNFTs with Bubblegum |
| 08 | [Marinade Staking](../app/app/examples/08-marinade-staking) | Liquid staking integration |

## Architecture Overview

This cookbook adds a layer of reusable patterns on top of the LazorKit SDK:

```
┌─────────────────────────────────────────────────────────────┐
│                      Your dApp                               │
├─────────────────────────────────────────────────────────────┤
│  COOKBOOK PATTERNS (what we built - copy these!)            │
│  ├─ Hooks: useLazorkitWalletConnect, useBalances            │
│  └─ Utils: processInstructionsForLazorKit, createDummySigner│
├─────────────────────────────────────────────────────────────┤
│  @lazorkit/wallet (native SDK)                              │
│  ├─ LazorkitProvider     ├─ useWallet()                     │
│  ├─ Passkey auth         ├─ signAndSendTransaction()        │
│  └─ Paymaster service    └─ Gasless transactions            │
├─────────────────────────────────────────────────────────────┤
│                      Solana                                  │
└─────────────────────────────────────────────────────────────┘
```

See [03 - Cookbook Patterns](03-cookbook-patterns.md) for detailed explanations of each pattern.

## Quick Links

- [Live Demo](https://lazorkit-cookbook.vercel.app)
- [LazorKit SDK Docs](https://docs.lazorkit.com)
- [GitHub Repository](https://github.com/0xharp/lazorkit-cookbook)
