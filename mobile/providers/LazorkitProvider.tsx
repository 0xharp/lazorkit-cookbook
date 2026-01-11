import { ReactNode } from 'react';
import { LazorKitProvider as NativeLazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '@/lib/constants';

interface Props {
  children: ReactNode;
}

export function LazorkitProvider({ children }: Props) {
  return (
    <NativeLazorKitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      configPaymaster={{
        paymasterUrl: PAYMASTER_URL,
      }}
      isDebug={__DEV__}
    >
      {children}
    </NativeLazorKitProvider>
  );
}
