'use client';

import { useState, useCallback } from 'react';

interface TransferFormState {
    recipient: string;
    amount: string;
    sending: boolean;
    retryCount: number;
    lastTxSignature: string;
}

interface UseTransferFormReturn {
    // State values
    recipient: string;
    amount: string;
    sending: boolean;
    retryCount: number;
    lastTxSignature: string;
    // Setters
    setRecipient: (value: string) => void;
    setAmount: (value: string) => void;
    setSending: (value: boolean) => void;
    setRetryCount: (value: number) => void;
    setLastTxSignature: (value: string) => void;
    // Utilities
    resetForm: () => void;
    startSending: () => void;
    stopSending: () => void;
}

/**
 * Custom hook for managing transfer form state
 * Provides consistent state management across different wallet adapter implementations
 */
export function useTransferForm(): UseTransferFormReturn {
    const [state, setState] = useState<TransferFormState>({
        recipient: '',
        amount: '',
        sending: false,
        retryCount: 0,
        lastTxSignature: '',
    });

    const setRecipient = useCallback((value: string) => {
        setState(prev => ({ ...prev, recipient: value }));
    }, []);

    const setAmount = useCallback((value: string) => {
        setState(prev => ({ ...prev, amount: value }));
    }, []);

    const setSending = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, sending: value }));
    }, []);

    const setRetryCount = useCallback((value: number) => {
        setState(prev => ({ ...prev, retryCount: value }));
    }, []);

    const setLastTxSignature = useCallback((value: string) => {
        setState(prev => ({ ...prev, lastTxSignature: value }));
    }, []);

    const resetForm = useCallback(() => {
        setState(prev => ({
            ...prev,
            recipient: '',
            amount: '',
        }));
    }, []);

    const startSending = useCallback(() => {
        setState(prev => ({
            ...prev,
            sending: true,
            retryCount: 0,
        }));
    }, []);

    const stopSending = useCallback(() => {
        setState(prev => ({
            ...prev,
            sending: false,
            retryCount: 0,
        }));
    }, []);

    return {
        recipient: state.recipient,
        amount: state.amount,
        sending: state.sending,
        retryCount: state.retryCount,
        lastTxSignature: state.lastTxSignature,
        setRecipient,
        setAmount,
        setSending,
        setRetryCount,
        setLastTxSignature,
        resetForm,
        startSending,
        stopSending,
    };
}
