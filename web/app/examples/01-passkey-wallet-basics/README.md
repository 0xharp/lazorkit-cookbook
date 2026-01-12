# Recipe 01: Passkey Wallet Basics

**Create Solana wallets using Face ID/Touch ID - no seed phrases, no browser extensions**

This recipe teaches you the fundamentals of LazorKit's passkey authentication and smart wallet system. By the end, you'll understand how to create wallets, check balances, and provide a seamless Web2-like onboarding experience.

> **Environment**: Next.js 16 + React 19. For polyfill setup, see [`lib/polyfills.ts`](../../../lib/polyfills.ts) and [`next.config.ts`](../../../next.config.ts). For complete setup instructions, refer to the [Getting Started guide](../../../../docs/web/01-getting-started.md). For patterns used in this cookbook, see [Cookbook Patterns](../../../../docs/web/03-cookbook-patterns.md).

---

## What You'll Learn

- Create a Solana wallet using WebAuthn (Face ID/Touch ID)
- Access wallet addresses and public keys
- Check SOL and USDC balances
- Request devnet airdrops for testing
- Disconnect and manage wallet sessions

---

## Prerequisites

Before starting this recipe, make sure you have:

1. LazorKit SDK installed:
```bash
npm install @lazorkit/wallet @solana/web3.js
```

2. LazorKit Provider configured in your app (see [Provider Setup](#provider-setup))

---

## Step 1: Set Up the LazorKit Provider

First, wrap your application with the LazorKit provider to enable wallet functionality:

```typescript
// providers/LazorkitProvider.tsx
'use client';

import { LazorkitProvider as LazorkitWalletProvider } from '@lazorkit/wallet';
import { ReactNode } from 'react';

export function LazorkitProvider({ children }: { children: ReactNode }) {
  return (
    <LazorkitWalletProvider
      rpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'}
      portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'}
      paymasterConfig={{
        paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com'
      }}
    >
      {children}
    </LazorkitWalletProvider>
  );
}
```

Add it to your root layout:

```typescript
// app/layout.tsx
import { LazorkitProvider } from '@/providers/LazorkitProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LazorkitProvider>
          {children}
        </LazorkitProvider>
      </body>
    </html>
  );
}
```

---

## Step 2: Import the Hooks

The cookbook provides custom hooks that wrap LazorKit's functionality with error handling and state management:

```typescript
'use client';

import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';
import { getConnection } from '@/lib/solana-utils';
```

---

## Step 3: Connect with Passkey Authentication

Use the `useLazorkitWalletConnect` hook to create or access a wallet using Face ID/Touch ID. This hook handles popup blocked errors and loading states automatically:

```typescript
export default function WalletPage() {
  const { wallet, isConnected, connect, connecting } = useLazorkitWalletConnect();

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? 'Creating Wallet...' : 'Create Wallet with Passkey'}
    </button>
  );
}
```

The `useLazorkitWalletConnect` hook automatically handles:
- Loading state management (`connecting`)
- Popup blocked error detection and user alerts
- Connection error handling

**What happens when `connect()` is called:**
1. LazorKit opens a portal window for passkey authentication
2. User authenticates with Face ID, Touch ID, or security key
3. A smart wallet address is generated and returned
4. The wallet object is populated with the user's address

---

## Step 4: Access Wallet Information

Once connected, access the wallet address via `wallet.smartWallet`:

```typescript
{isConnected && wallet && (
  <div>
    <h3>Connected!</h3>
    <p>Wallet Address: {wallet.smartWallet}</p>

    {/* Copy address to clipboard */}
    <button onClick={() => {
      navigator.clipboard.writeText(wallet.smartWallet);
      alert('Address copied!');
    }}>
      Copy Address
    </button>

    {/* View on Explorer */}
    <a
      href={`https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`}
      target="_blank"
    >
      View on Explorer
    </a>
  </div>
)}
```

---

## Step 5: Fetch Token Balances

Use the `useBalances` hook to automatically fetch and manage SOL and USDC balances:

```typescript
export default function WalletPage() {
  const { wallet, isConnected } = useLazorkitWalletConnect();

  // Automatically fetches balances when wallet connects
  const {
    solBalance,
    usdcBalance,
    loading: refreshing,
    fetchBalances,
  } = useBalances(isConnected ? wallet?.smartWallet : null);

  return (
    <div>
      <p>SOL: {solBalance?.toFixed(4) ?? 'Loading...'}</p>
      <p>USDC: {usdcBalance?.toFixed(2) ?? 'Loading...'}</p>
      <button onClick={fetchBalances} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Balances'}
      </button>
    </div>
  );
}
```

The `useBalances` hook provides:
- Automatic balance fetching on wallet connection
- `fetchBalances()` function for manual refresh
- Loading states and error handling
- Cached connection for better performance

---

## Step 6: Request Devnet Airdrops

For testing, you can request SOL from the devnet faucet using the shared connection:

```typescript
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-utils';

const handleAirdrop = async () => {
  if (!wallet) return;

  try {
    const connection = getConnection();
    const publicKey = new PublicKey(wallet.smartWallet);

    // Request 1 SOL airdrop
    const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);

    alert('Airdrop successful! You received 1 SOL');

    // Refresh balances using the hook
    await fetchBalances();
  } catch (err: unknown) {
    console.error('Airdrop error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    alert(
      'Airdrop failed!\n\n' +
      'Devnet faucets have rate limits. Try:\n' +
      '- https://faucet.solana.com (SOL)\n' +
      '- https://faucet.circle.com (USDC)\n\n' +
      `Error: ${message}`
    );
  }
};
```

---

## Step 7: Disconnect Wallet

Allow users to disconnect their wallet:

```typescript
<button onClick={disconnect}>
  Disconnect Wallet
</button>
```

---

## Complete Example

The complete implementation uses the centralized hooks and utilities for clean, maintainable code.

**Custom Hooks Used:**

| Hook | Description |
|----------|-------------|
| `useLazorkitWalletConnect()` | Handles wallet connection with popup error handling |
| `useBalances()` | Fetches and manages SOL/USDC balances automatically |

**Utility Functions:**

| Function | Description |
|----------|-------------|
| `getConnection()` | Returns a cached Solana connection instance |
| `getAssociatedTokenAddressSync()` | Derives token account addresses |

**Key Pattern - Wallet Connection:**

```typescript
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useBalances } from '@/hooks/useBalances';

export default function WalletPage() {
  const { wallet, isConnected, connect, connecting } = useLazorkitWalletConnect();

  const { solBalance, usdcBalance, fetchBalances } = useBalances(
    isConnected ? wallet?.smartWallet : null
  );

  return (
    <button onClick={connect} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect with Passkey'}
    </button>
  );
}
```

> **Source**: See the full implementation at [`page.tsx`](page.tsx)

---

## Key Concepts

### WebAuthn Passkey Authentication
Instead of seed phrases, LazorKit uses WebAuthn (the same technology behind Face ID login on websites). Your private keys are stored securely in your device's secure enclave and never leave your device.

### Smart Wallet
When you create a wallet, LazorKit generates a smart wallet address on Solana. This is a regular Solana address that can:
- Receive SOL and SPL tokens
- Interact with any Solana program
- Sign transactions using your biometrics

### No Browser Extensions
Unlike traditional Solana wallets (Phantom, Solflare), LazorKit doesn't require any browser extensions. Everything works directly in your browser or mobile app through the LazorKit portal.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Popup blocked | Allow popups for the site in browser settings |
| Connection fails | Ensure LazorKit portal URL is correct |
| Balance shows 0 | The token account may not exist yet (created on first transfer) |
| Airdrop fails | Devnet faucets have rate limits - wait or use external faucets |

---

## Next Steps

Now that you understand wallet basics, proceed to:

- **[Recipe 02: Gasless USDC Transfer](../02-gasless-transfer/README.md)** - Learn how to send tokens without paying gas fees!
- **[Recipe 04: Gasless Raydium Swap](../04-gasless-raydium-swap/README.md)** - Swap tokens on Raydium DEX without gas fees!

---

## Live Demo

Try this recipe live at: [https://lazorkit-cookbook.vercel.app/examples/01-passkey-wallet-basics](https://lazorkit-cookbook.vercel.app/examples/01-passkey-wallet-basics)

---

## Resources

- [LazorKit React SDK Docs](https://docs.lazorkit.com/react-sdk/getting-started)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [WebAuthn Specification](https://webauthn.guide/)
