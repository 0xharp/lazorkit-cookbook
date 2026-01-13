'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { buildInitializeSubscriptionIx, hasActiveSubscription } from '@/lib/program/subscription-service';
import {
    calculateExpiryTimestamp,
    getAllPlans,
    SUBSCRIPTION_CONSTANTS,
    PlanFeatures,
    getBadgeColorClasses,
    getGradientClasses, formatInterval
} from '@/lib/constants';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { getConnection } from '@/lib/solana-utils';

export default function SubscribePage() {
    const { isConnected, wallet, connect, connecting, signAndSendTransaction } = useLazorkitWalletConnect();
    const theme = useThemeClasses();
    const router = useRouter();
    const [subscribing, setSubscribing] = useState(false);
    const [checking, setChecking] = useState(true);
    const [hasSubscription, setHasSubscription] = useState(false);
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [selectedExpiry, setSelectedExpiry] = useState<number>(12);

    const plans = getAllPlans();

    useEffect(() => {
        if (wallet) {
            checkExistingSubscription();
        } else {
            setChecking(false);
        }
    }, [wallet]);

    const checkExistingSubscription = async () => {
        if (!wallet) return;

        setChecking(true);
        try {
            const connection = getConnection();
            const userWallet = new PublicKey(wallet.smartWallet);
            const hasActive = await hasActiveSubscription(userWallet, connection);
            setHasSubscription(hasActive);
        } catch (err) {
            console.error('Error checking subscription:', err);
            setHasSubscription(false);
        } finally {
            setChecking(false);
        }
    };

    const handleSubscribe = async (plan: PlanFeatures) => {
        if (!wallet) return;

        if (hasSubscription) {
            alert('You already have an active subscription!\n\nPlease cancel your existing subscription first.');
            return;
        }

        setSubscribing(true);
        setSelectedPlanId(plan.id);

        try {
            const userWallet = new PublicKey(wallet.smartWallet);
            const connection = getConnection();

            console.log(`🚀 Creating ${plan.name} subscription with prepaid first payment...`);
            const expiresAt = calculateExpiryTimestamp(selectedExpiry)

            const instructions = await buildInitializeSubscriptionIx(
                {
                    userWallet,
                    amountPerPeriod: plan.price,
                    intervalSeconds: plan.interval,
                    expiresAt,
                },
                connection
            );

            console.log(`📦 Built ${instructions.length} instruction(s)`);

            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: SUBSCRIPTION_CONSTANTS.COMPUTE_UNIT_LIMIT
                }
            });

            console.log('✅ Subscription created:', signature);

            alert(
                `${plan.displayName} subscription created successfully!\n\n` +
                `💰 First payment of ${plan.priceDisplay} USDC charged!\n\n` +
                `View transaction:\nhttps://explorer.solana.com/tx/${signature}?cluster=${SUBSCRIPTION_CONSTANTS.NETWORK}`
            );

            setTimeout(() => {
                router.push('/examples/03-subscription-service/dashboard');
            }, 1500);

        } catch (err: any) {
            console.error('❌ Subscription error:', err);

            let errorMessage = err.message || String(err);

            if (errorMessage.includes('already exists')) {
                errorMessage = 'You already have an active subscription!\n\nPlease cancel your existing subscription first.';
                setHasSubscription(true);
            } else if (errorMessage.includes('Load failed')) {
                errorMessage = 'Transaction failed to complete. This might be a temporary issue.\n\nPlease try again in a few seconds.';
            } else if (errorMessage.includes('insufficient funds')) {
                errorMessage = `Insufficient USDC balance.\n\nPlease make sure you have at least ${plan.priceDisplay} USDC in your wallet.`;
            }

            alert(`Failed to create subscription:\n${errorMessage}`);
        } finally {
            setSubscribing(false);
            setSelectedPlanId(null);
        }
    };

    if (checking) {
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
                            Connect with Face ID to subscribe to a plan and start your subscription
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

    return (
        <div className={`min-h-screen overflow-x-hidden ${theme.bgPage}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Link
                    href="/examples/03-subscription-service"
                    className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}
                >
                    ← Back to Recipe 03
                </Link>

                <div className="text-center mb-12">
                    <h1 className={`text-4xl md:text-5xl font-bold ${theme.textPrimary} mb-4`}>Choose Your Plan</h1>
                    <p className={`text-lg md:text-xl ${theme.textSecondary}`}>Simple, transparent pricing. Cancel anytime.</p>
                </div>

                {/* Fee Information Banner */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className={`${theme.infoBlue} rounded-xl p-5 backdrop-blur-lg`}>
                        <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">ℹ️</div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-base md:text-lg font-bold ${theme.infoBlueTitle} mb-2`}>
                                    How Payments Work
                                </h3>
                                <div className={`space-y-2 ${theme.infoBlueText} text-sm`}>
                                    <p className="break-words">
                                        <strong>One-time setup:</strong> ~{SUBSCRIPTION_CONSTANTS.SETUP_FEE_SOL} SOL to create your subscription account which gets refunded post subscription cancellation. In production we would be planning to deploy a paymaster to cover this subscription account rent also, or would work with LazorKit team to see if an enhancement is possible in the current Paymaster.
                                    </p>
                                    <p>
                                        <strong>First payment:</strong> Charged immediately when you subscribe (prepaid)
                                    </p>
                                    <p>
                                        <strong>Transaction fees:</strong> $0 - paid by our paymaster (gasless for you!)
                                    </p>
                                    <p>
                                        <strong>On cancellation:</strong> Full refund of setup fee
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowFeeInfo(!showFeeInfo)}
                                    className={`mt-3 ${theme.infoBlueTitle} hover:opacity-80 text-xs underline`}
                                >
                                    {showFeeInfo ? 'Hide' : 'Learn more'} about fees
                                </button>

                                {showFeeInfo && (
                                    <div className={`mt-4 pt-4 border-t ${theme.border} text-xs ${theme.infoBlueText} space-y-2`}>
                                        <p><strong>Why the setup fee?</strong></p>
                                        <p className="break-words">
                                            Solana requires rent (~{SUBSCRIPTION_CONSTANTS.SETUP_FEE_SOL} SOL) for creating accounts.
                                            This prevents spam and you get it back when you cancel!
                                        </p>
                                        <p className="pt-2"><strong>Cost breakdown:</strong></p>
                                        <ul className="list-disc list-inside space-y-1 pl-2">
                                            <li>Setup: ~{SUBSCRIPTION_CONSTANTS.SETUP_FEE_SOL} SOL (refundable on cancel)</li>
                                            <li>First payment: Plan price (charged immediately)</li>
                                            <li>All gas fees: $0 (paid by paymaster)</li>
                                            <li>Net lifetime cost: Just the subscription fees</li>
                                        </ul>
                                        <p className={`pt-2 ${theme.infoBlueTitle} break-words`}>
                                            <strong>Prepaid model:</strong> We charge your first month upfront, then automatically every 30 days.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expiry Selection */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className={`${theme.bgCard} rounded-xl p-5`}>
                        <h3 className={`text-lg font-bold ${theme.textPrimary} mb-3`}>
                            Select Subscription Duration
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {SUBSCRIPTION_CONSTANTS.EXPIRY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedExpiry(option.value)}
                                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${selectedExpiry === option.value
                                        ? theme.btnPrimary
                                        : `${theme.bgCardAlt} ${theme.textSecondary} ${theme.borderSubtle} hover:opacity-80`
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className={`text-xs ${theme.textMuted} mt-3`}>
                            {selectedExpiry === 0
                                ? '✓ Subscription continues until you cancel'
                                : `✓ Subscription will auto-cancel after ${selectedExpiry} months`
                            }
                        </p>
                    </div>
                </div>

                {/* Existing Subscription Banner */}
                {hasSubscription && (
                    <div className="max-w-4xl mx-auto mb-8">
                        <div className={`${theme.infoYellow} rounded-xl p-6 backdrop-blur-lg`}>
                            <div className="flex items-start gap-4">
                                <div className="text-3xl flex-shrink-0">⚠️</div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-lg md:text-xl font-bold ${theme.infoYellowTitle} mb-2`}>
                                        You Already Have an Active Subscription
                                    </h3>
                                    <p className={`${theme.infoYellowText} mb-4 text-sm md:text-base`}>
                                        Please cancel your existing subscription before creating a new one.
                                    </p>
                                    <Link
                                        href="/examples/03-subscription-service/dashboard"
                                        className={`inline-block px-6 py-2 rounded-lg ${theme.infoYellow} ${theme.infoYellowTitle} font-semibold transition-all text-sm hover:opacity-80`}
                                    >
                                        Go to Dashboard →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Cards Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`${theme.bgCard} rounded-2xl p-6 md:p-8 transition-all ${hasSubscription
                                ? 'opacity-60 pointer-events-none'
                                : plan.popular
                                    ? `border-2 ${theme.isLazorkit ? 'border-[#7857FF] shadow-[0px_4px_20px_rgba(120,87,255,0.15)]' : 'border-purple-500/50'} md:scale-105 z-10`
                                    : `border ${theme.border} hover:opacity-90`
                                }`}
                        >
                            <div className="text-center mb-6">
                                {plan.badge && (
                                    <div className={`inline-block px-4 py-1 rounded-full ${getBadgeColorClasses(plan.badgeColor)} text-sm font-semibold mb-4`}>
                                        {plan.badge}
                                    </div>
                                )}
                                <h2 className={`text-2xl md:text-3xl font-bold ${theme.textPrimary} mb-2`}>{plan.displayName}</h2>
                                {plan.description && (
                                    <p className={`${theme.textMuted} text-xs md:text-sm mb-4`}>{plan.description}</p>
                                )}
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className={`text-4xl md:text-5xl font-bold ${theme.textPrimary}`}>{plan.priceDisplay}</span>
                                    <span className={`${theme.textMuted} text-sm`}>USDC / {plan.intervalDisplay}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                        <span className={`${theme.textSecondary} text-xs md:text-sm break-words`}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={subscribing || hasSubscription}
                                className={`w-full px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:cursor-not-allowed text-sm md:text-base ${hasSubscription
                                    ? 'bg-gray-400 text-gray-700'
                                    : plan.popular
                                        ? theme.btnPrimary
                                        : theme.isLazorkit
                                            ? 'bg-white border border-[#7857FF]/30 text-[#674BF7] hover:bg-[#F5F3FF] shadow-sm'
                                            : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                                    }`}
                            >
                                {subscribing && selectedPlanId === plan.id
                                    ? 'Creating...'
                                    : hasSubscription
                                        ? 'Already Subscribed'
                                        : `Subscribe to ${plan.name}`}
                            </button>

                            <p className={`text-center ${theme.textMuted} text-xs mt-4`}>
                                Charged immediately, then every {formatInterval(plan.interval)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
