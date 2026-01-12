import { useWalletContext } from '@/contexts/WalletContext';

/**
 * Wrapper hook for LazorKit wallet with mobile-specific error handling
 *
 * This hook provides access to the shared wallet context, ensuring
 * wallet state is maintained across all screens in the app.
 *
 * Features:
 * - Shared wallet state across all components
 * - Connecting state tracking
 * - Alert-based error display
 * - Deep link redirect handling
 */
export function useLazorkitWalletConnect() {
    return useWalletContext();
}
