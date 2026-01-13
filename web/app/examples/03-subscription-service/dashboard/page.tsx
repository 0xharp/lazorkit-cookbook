'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import {
    getSubscriptionPDA, buildCancelSubscriptionIx, MERCHANT_WALLET
} from '@/lib/program/subscription-service';
import {
    SUBSCRIPTION_CONSTANTS,
    getPlanById,
    formatInterval
} from '@/lib/constants';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { getConnection } from '@/lib/solana-utils';

interface SubscriptionData {
    authority: string;
    recipient: string;
    userTokenAccount: string;
    recipientTokenAccount: string;
    tokenMint: string;
    amountPerPeriod: number;
    intervalSeconds: number;
    lastChargeTimestamp: number;
    createdAt: number;
    expiresAt: number | null;
    isActive: boolean;
    totalCharged: number;
    bump: number;
}

export default function DashboardPage() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const theme = useThemeClasses();
    const router = useRouter();
    const [hasSubscription, setHasSubscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [subscriptionAddress, setSubscriptionAddress] = useState<string>('');
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
    const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (wallet) {
            setHasSubscription(false);
            setSubscriptionData(null);
            setLoading(true);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, [wallet?.smartWallet]);

    useEffect(() => {
        if (cooldownRemaining <= 0) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, 60 - Math.floor((Date.now() - lastTriggerTime) / 1000));
            setCooldownRemaining(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [lastTriggerTime, cooldownRemaining]);

    const parseSubscriptionData = (data: Buffer): SubscriptionData => {
        let offset = 8;

        const authority = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        const recipient = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        const userTokenAccount = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        const recipientTokenAccount = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        const tokenMint = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;

        const amountPerPeriod = Number(data.readBigUInt64LE(offset)) / 1_000_000;
        offset += 8;

        const intervalSeconds = Number(data.readBigInt64LE(offset));
        offset += 8;

        const lastChargeTimestamp = Number(data.readBigInt64LE(offset));
        offset += 8;

        const createdAt = Number(data.readBigInt64LE(offset));
        offset += 8;

        const hasExpiry = data.readUInt8(offset) === 1;
        offset += 1;

        let expiresAt: number | null = null;
        if (hasExpiry) {
            expiresAt = Number(data.readBigInt64LE(offset));
            offset += 8;
        }

        const isActive = data.readUInt8(offset) === 1;
        offset += 1;

        const totalCharged = Number(data.readBigUInt64LE(offset)) / 1_000_000;
        offset += 8;

        const bump = data.readUInt8(offset);

        return {
            authority,
            recipient,
            userTokenAccount,
            recipientTokenAccount,
            tokenMint,
            amountPerPeriod,
            intervalSeconds,
            lastChargeTimestamp,
            createdAt,
            expiresAt,
            isActive,
            totalCharged,
            bump,
        };
    };

    const checkSubscription = async () => {
        if (!wallet) return;

        setRefreshing(true);
        setLoading(true);
        try {
            const connection = getConnection();
            const userWallet = new PublicKey(wallet.smartWallet);
            const [subscriptionPDA] = getSubscriptionPDA(userWallet, MERCHANT_WALLET);

            const accountInfo = await connection.getAccountInfo(subscriptionPDA, 'confirmed');

            if (accountInfo) {
                const parsedData = parseSubscriptionData(accountInfo.data);

                if (parsedData.isActive) {
                    setHasSubscription(true);
                    setSubscriptionData(parsedData);
                    setSubscriptionAddress(subscriptionPDA.toBase58());
                } else {
                    setHasSubscription(false);
                    setSubscriptionData(null);
                }
            } else {
                setHasSubscription(false);
                setSubscriptionData(null);
            }
        } catch (err) {
            console.error('Error checking subscription:', err);
            setHasSubscription(false);
            setSubscriptionData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancel = async () => {
        if (!wallet) return;

        const confirmed = confirm(
            'Are you sure you want to cancel your subscription?\n\n' +
            `• Setup fee (~${SUBSCRIPTION_CONSTANTS.SETUP_FEE_SOL} SOL) will be refunded\n` +
            '• No further charges will occur'
        );

        if (!confirmed) return;

        setCancelling(true);
        try {
            const userWallet = new PublicKey(wallet.smartWallet);

            const instruction = await buildCancelSubscriptionIx(userWallet);

            const signature = await signAndSendTransaction({
                instructions: [instruction],
                transactionOptions: {
                    computeUnitLimit: SUBSCRIPTION_CONSTANTS.COMPUTE_UNIT_LIMIT
                }
            });

            alert(
                'Subscription canceled successfully!\n\n' +
                `💰 Setup fee refunded (~${SUBSCRIPTION_CONSTANTS.SETUP_FEE_SOL} SOL)\n\n` +
                `View transaction:\nhttps://explorer.solana.com/tx/${signature}?cluster=${SUBSCRIPTION_CONSTANTS.NETWORK}`
            );

            setTimeout(() => {
                router.push('/examples/03-subscription-service/subscribe');
            }, 1500);

        } catch (err: any) {
            console.error('❌ Cancel error:', err);
            alert(`Failed to cancel subscription:\n${err.message || err}`);
        } finally {
            setCancelling(false);
        }
    };

    const handleProcessPayment = async () => {
        if (cooldownRemaining > 0) {
            alert(`Please wait ${cooldownRemaining} seconds before triggering again.`);
            return;
        }

        const confirmed = confirm(
            '🔄 Trigger Payment Processing\n\n' +
            'This will scan all subscriptions and charge those that are due.\n\n' +
            'Continue?'
        );

        if (!confirmed) return;

        setLastTriggerTime(Date.now());
        setCooldownRemaining(60);
        setProcessing(true);

        try {
            const response = await fetch('/api/charge-subscriptions', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.status === 429) {
                alert('⚠️ Rate Limit Exceeded\n\nToo many requests. Please wait a minute and try again.');
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process payments');
            }

            const { results } = data;
            let message = `✅ Payment Processing Complete\n\n`;
            message += `📊 Results:\n`;
            message += `• Total subscriptions: ${results.total}\n`;
            message += `• Charged: ${results.charged.length}\n`;
            message += `• Skipped: ${results.skipped.length}\n`;
            message += `• Errors: ${results.errors.length}\n\n`;

            if (results.charged.length > 0) {
                message += `💰 Charged subscriptions:\n`;
                results.charged.forEach((sig: string) => {
                    message += `• ${sig.slice(0, 8)}...${sig.slice(-8)}\n`;
                });
            }

            alert(message);
            await checkSubscription();

        } catch (err: any) {
            console.error('Payment processing error:', err);
            alert(`❌ Failed to process payments:\n${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const getPlanDisplay = () => {
        if (!subscriptionData) return null;

        const plan = getPlanById(
            subscriptionData.amountPerPeriod === 0.1 ? 'basic' :
                subscriptionData.amountPerPeriod === 0.2 ? 'pro' :
                    subscriptionData.amountPerPeriod === 0.3 ? 'enterprise' :
                        'test'
        );

        return plan?.displayName || 'Subscription';
    };

    const getNextChargeDate = () => {
        if (!subscriptionData) return '';

        const nextCharge = new Date((subscriptionData.lastChargeTimestamp + subscriptionData.intervalSeconds) * 1000);
        const now = new Date();
        const isDue = nextCharge <= now;

        return isDue ? 'Due Now' : nextCharge.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Link
                        href="/examples/03-subscription-service"
                        className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                    >
                        ← Back to Recipe 03
                    </Link>
                    <div className="flex items-center justify-center py-20">
                        <div className={`${theme.textPrimary} text-lg`}>Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Link
                        href="/examples/03-subscription-service"
                        className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                    >
                        ← Back to Recipe 03
                    </Link>

                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-6">🔐</div>
                        <h2 className={`text-3xl font-bold ${theme.textPrimary} mb-4`}>Connect Your Wallet</h2>
                        <p className={`${theme.textMuted} mb-8 text-center max-w-md`}>
                            Connect with Face ID to view your subscription dashboard
                        </p>
                        <button
                            onClick={connect}
                            disabled={connecting}
                            className={theme.btnPrimary}
                        >
                            {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasSubscription) {
        return (
            <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Link
                        href="/examples/03-subscription-service"
                        className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                    >
                        ← Back to Recipe 03
                    </Link>

                    <div className="max-w-2xl mx-auto text-center py-20">
                        <div className="text-6xl mb-6">📭</div>
                        <h2 className={`text-3xl font-bold ${theme.textPrimary} mb-4`}>No Active Subscription</h2>
                        <p className={`${theme.textMuted} mb-8`}>
                            You don't have an active subscription yet. Choose a plan to get started!
                        </p>
                        <Link
                            href="/examples/03-subscription-service/subscribe"
                            className={`${theme.btnPrimary} text-center`}
                        >
                            View Plans →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/examples/03-subscription-service"
                        className={`${theme.textAccent} hover:opacity-80`}
                    >
                        ← Back to Recipe 03
                    </Link>
                    <button
                        onClick={checkSubscription}
                        disabled={refreshing}
                        className={`${theme.textAccent} hover:opacity-80 text-sm flex items-center gap-2 disabled:opacity-50`}
                    >
                        <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                <h1 className={`text-3xl md:text-4xl font-bold ${theme.textPrimary} mb-8`}>Subscription Dashboard</h1>

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Current Plan */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Current Plan</h2>
                            <div className="space-y-3">
                                <div>
                                    <span className={`${theme.textMuted} text-sm`}>Plan</span>
                                    <div className={`text-2xl font-bold ${theme.textPrimary}`}>{getPlanDisplay()}</div>
                                </div>
                                <div>
                                    <span className={`${theme.textMuted} text-sm`}>Price</span>
                                    <div className={`text-xl font-semibold ${theme.textPrimary}`}>
                                        {subscriptionData?.amountPerPeriod} USDC / {formatInterval(subscriptionData?.intervalSeconds || 0)}
                                    </div>
                                </div>
                                <div>
                                    <span className={`${theme.textMuted} text-sm`}>Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
                                        <span className="text-green-600 dark:text-green-400 font-semibold">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className={`${theme.bgCard} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Payment Information</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className={theme.textMuted}>Last Charged</span>
                                    <span className={theme.textPrimary}>
                                        {new Date((subscriptionData?.lastChargeTimestamp || 0) * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={theme.textMuted}>Next Charge</span>
                                    <span className={theme.textPrimary}>
                                        {getNextChargeDate()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={theme.textMuted}>Total Charged</span>
                                    <span className={`${theme.textPrimary} font-semibold`}>
                                        {subscriptionData?.totalCharged} USDC
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={theme.textMuted}>Expires at</span>
                                    <span className={theme.textPrimary}>
                                        {subscriptionData?.expiresAt
                                            ? new Date(subscriptionData.expiresAt * 1000).toLocaleDateString()
                                            : 'Perpetual'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className={`w-full px-6 py-3 ${theme.statusError} rounded-xl font-semibold transition-all disabled:opacity-50 hover:opacity-80`}
                        >
                            {cancelling ? 'Canceling...' : '🗑️ Cancel Subscription'}
                        </button>
                    </div>

                    {/* Right Column - Admin Controls */}
                    <div className="space-y-6">
                        <div className={`${theme.bgCardAlt} rounded-2xl p-6`}>
                            <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>⚡ Admin Controls</h2>

                            <div className="space-y-4">
                                {/* Cooldown Timer */}
                                {cooldownRemaining > 0 && (
                                    <div className={`${theme.infoYellow} rounded-lg p-4`}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 flex-shrink-0">
                                                <svg className="w-12 h-12 transform -rotate-90">
                                                    <circle
                                                        cx="24"
                                                        cy="24"
                                                        r="20"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        className="opacity-20"
                                                    />
                                                    <circle
                                                        cx="24"
                                                        cy="24"
                                                        r="20"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        strokeDasharray={`${2 * Math.PI * 20}`}
                                                        strokeDashoffset={`${2 * Math.PI * 20 * (cooldownRemaining / 60)}`}
                                                        className="transition-all duration-1000"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`${theme.infoYellowTitle} text-xs font-bold`}>
                                                        {cooldownRemaining}s
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`${theme.infoYellowTitle} font-semibold text-sm`}>
                                                    ⏰ Cooldown Active
                                                </div>
                                                <div className={`${theme.infoYellowText} text-xs mt-1 break-words`}>
                                                    Wait {cooldownRemaining} seconds before triggering again
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleProcessPayment}
                                    disabled={processing || cooldownRemaining > 0}
                                    className={`w-full px-6 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm md:text-base ${processing || cooldownRemaining > 0
                                        ? `${theme.bgCard} ${theme.textMuted} cursor-not-allowed`
                                        : `${theme.btnPrimary} shadow-lg shadow-indigo-500/20`
                                        }`}
                                >
                                    {processing ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Processing...
                                        </>
                                    ) : cooldownRemaining > 0 ? (
                                        <>
                                            <span>🔒</span>
                                            Cooldown ({cooldownRemaining}s)
                                        </>
                                    ) : (
                                        <>
                                            <span>⚡</span>
                                            Trigger Payment Processing
                                        </>
                                    )}
                                </button>

                                {/* Info Boxes */}
                                <div className="space-y-3 text-xs">
                                    <div className={`${theme.infoBlue} rounded-lg p-3`}>
                                        <div className="flex gap-2">
                                            <span className="text-lg flex-shrink-0">💡</span>
                                            <div className="flex-1 min-w-0">
                                                <div className={`${theme.infoBlueTitle} font-semibold mb-1`}>
                                                    How It Works
                                                </div>
                                                <div className={`${theme.infoBlueText} break-words`}>
                                                    Scans all subscriptions and charges those due for payment.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${theme.infoPurple} rounded-lg p-3`}>
                                        <div className="flex gap-2">
                                            <span className="text-lg flex-shrink-0">🤖</span>
                                            <div className="flex-1 min-w-0">
                                                <div className={`${theme.infoPurpleTitle} font-semibold mb-1`}>
                                                    No User Signature
                                                </div>
                                                <div className={`${theme.infoPurpleText} break-words`}>
                                                    Charges use delegated tokens - fully automatic!
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${theme.infoYellow} rounded-lg p-3`}>
                                        <div className="flex gap-2">
                                            <span className="text-lg flex-shrink-0">⚠️</span>
                                            <div className="flex-1 min-w-0">
                                                <div className={`${theme.infoYellowTitle} font-semibold mb-1`}>
                                                    Rate Limited
                                                </div>
                                                <div className={`${theme.infoYellowText} break-words`}>
                                                    60s cooldown for demo safety.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
