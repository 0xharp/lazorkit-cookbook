'use client';

import Link from 'next/link';
import { useThemeClasses } from '@/hooks/useThemeClasses';

export default function Recipe03OverviewPage() {
  const theme = useThemeClasses();

  return (
    <div className={`min-h-screen ${theme.bgPage} overflow-x-hidden`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className={`${theme.textAccent} hover:opacity-80 mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl">💰</span>
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl md:text-4xl font-bold ${theme.textPrimary} break-words`}>
                Recipe 03: Subscription Service
              </h1>
            </div>
          </div>
          <p className={`${theme.textMuted} text-sm md:text-base`}>
            Automated recurring payments demonstrating blockchain-native subscriptions with LazorKit
          </p>
        </div>

        {/* The Magic: Sign Once */}
        <div className="mb-8">
          <div className={`${theme.bgCta} rounded-2xl p-6 md:p-8`}>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl">✨</span>
              <div className="flex-1">
                <h2 className={`text-2xl md:text-3xl font-bold ${theme.textPrimary} mb-3`}>
                  The Magic: Sign Once with Face ID, Never Again
                </h2>
                <p className={`text-lg ${theme.textSecondary} mb-4`}>
                  This is what makes blockchain subscriptions incredible:
                </p>
                <div className={`space-y-3 ${theme.textSecondary}`}>
                  {[
                    { num: '1️⃣', title: 'User subscribes with Face ID (gasless via LazorKit)', desc: 'One Face ID authentication to delegate token spending permission' },
                    { num: '2️⃣', title: 'Automatic charges every billing cycle', desc: 'Backend service charges the user automatically - no signatures needed!' },
                    { num: '3️⃣', title: 'Cancel anytime (also gasless)', desc: 'One click to cancel, rent gets refunded automatically' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl">{item.num}</span>
                      <div>
                        <p className={`font-semibold ${theme.textPrimary}`}>{item.title}</p>
                        <p className={`text-sm ${theme.textMuted}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-4 p-4 ${theme.statusSuccess} rounded-lg`}>
                  <p className="font-semibold flex items-center gap-2">
                    <span>🎯</span>
                    <span>Just like Netflix or Spotify - but decentralized, transparent, and user-controlled!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* What You're Building */}
          <div className={`${theme.bgCard} rounded-2xl p-6`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>What We're Building</h2>
            <p className={`${theme.textSecondary} mb-4 text-sm`}>
              An automated subscription billing system demonstrating how blockchain-native recurring payments work with LazorKit integration:
            </p>
            <ul className={`space-y-3 text-sm md:text-base ${theme.textSecondary}`}>
              {[
                'Subscribe with minimal friction (gasless flow via LazorKit)',
                'Get charged automatically every billing cycle (no user signature needed!)',
                'Cancel anytime with rent refunds',
                'View subscription history and payment details'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-purple-500 mt-1 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 p-3 ${theme.bgCardAlt} rounded-lg`}>
              <p className="text-xs">
                <strong>This is a working proof-of-concept</strong> showcasing a novel integration pattern with LazorKit.
              </p>
            </div>
          </div>

          {/* The Core Innovation */}
          <div className={`${theme.bgCard} rounded-2xl p-6`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>The Core Innovation: Token Delegation</h2>
            <p className={`text-sm ${theme.textSecondary} mb-4`}>
              The key mechanism enabling automatic recurring payments is Solana's token delegation:
            </p>
            <div className={`${theme.codeBlock} rounded-lg p-4 mb-4 overflow-x-auto`}>
              <pre className="text-xs">
                {`// During subscription, user delegates once
const delegateIx = createApproveInstruction(
  userTokenAccount,
  merchantDelegate,
  userWallet,
  amountToDelegate
);

// Now merchant can charge automatically
// without requiring signatures! 🎉`}
              </pre>
            </div>
            <p className={`text-xs ${theme.textMuted}`}>
              After this one-time approval with Face ID, the merchant can charge the user automatically without requiring signatures for each payment.
            </p>
          </div>
        </div>

        {/* LazorKit Integration Benefits */}
        <div className="mb-8">
          <div className={`${theme.statusSuccess} rounded-2xl p-6`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
              <span>🚀</span> LazorKit Integration Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: '1. Simplified Onboarding', desc: 'User subscribes with Face ID - LazorKit handles the complexity', code: `await signAndSendTransaction({\n  instructions: [\n    initSubscriptionIx,\n    delegateTokensIx\n  ],\n});` },
                { title: '2. Gasless User Actions', desc: "LazorKit's paymaster covers gas fees for canceling, updating preferences, and viewing status." },
                { title: '3. Smart Wallet Persistence', desc: "LazorKit's smart wallets maintain consistent addresses across sessions." },
                { title: '4. Developer Experience', desc: 'Simple hooks instead of complex wallet adapter setup.' }
              ].map((item, i) => (
                <div key={i}>
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>{item.title}</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Limitations */}
        <div className="mb-8">
          <div className={`${theme.statusWarning} rounded-2xl p-6`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
              <span>⚠️</span> Current Limitations & Production Roadmap
            </h2>
            <p className={`text-sm ${theme.textSecondary} mb-4`}>
              This is a <strong>proof-of-concept</strong> demonstrating feasibility. For production deployment, several enhancements would be needed.
            </p>
            <div className="space-y-4">
              <div className={`${theme.bgCard} rounded-lg p-4`}>
                <h3 className={`text-base font-semibold ${theme.textPrimary} mb-2`}>1. PDA Rent Costs (~0.002 SOL)</h3>
                <p className={`text-sm ${theme.textSecondary}`}>Currently required to create subscription accounts. Gets refunded on cancellation.</p>
              </div>
              <div className={`${theme.bgCard} rounded-lg p-4`}>
                <h3 className={`text-base font-semibold ${theme.textPrimary} mb-2`}>2. Backend Charging Fees</h3>
                <p className={`text-sm ${theme.textSecondary}`}>The automated charging service pays transaction fees. In production, these could be absorbed as business costs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="mb-8">
          <div className={`${theme.bgCard} rounded-2xl p-6`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>Architecture Overview</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {[
                { title: 'Frontend (Next.js + LazorKit)', items: ['Users connect via Face ID', 'Subscribe with gasless flow', 'Manage subscriptions easily'], color: 'purple' },
                { title: 'Backend Service', items: ['Scans for due subscriptions', 'Charges using delegated tokens', 'Handles business logic'], color: 'blue' },
                { title: 'Smart Contract (Anchor)', items: ['Validates delegations', 'Processes charges', 'Manages cancellations'], color: 'green' }
              ].map((section, i) => (
                <div key={i} className={`${theme.isLazorkit ? `bg-${section.color}-50 border-${section.color}-200` : `bg-${section.color}-500/10 border-${section.color}-500/30`} border rounded-lg p-4`}>
                  <h3 className={`font-semibold ${theme.textPrimary} mb-2`}>{section.title}</h3>
                  <ul className={`${theme.textSecondary} space-y-1 text-xs`}>
                    {section.items.map((item, j) => <li key={j}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/examples/03-subscription-service/subscribe"
            className={`block p-8 ${theme.bgCta} ${theme.bgCardHover} rounded-2xl transition-all group`}
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2 group-hover:opacity-80 transition-colors`}>
              Try the Demo
            </h3>
            <p className={`${theme.textSecondary} mb-4 text-sm`}>
              Subscribe to a plan and experience the full flow. Sign once with Face ID!
            </p>
            <div className={`${theme.textAccent} font-semibold`}>
              Start Subscribing →
            </div>
          </Link>

          <Link
            href="/examples/03-subscription-service/dashboard"
            className={`block p-8 ${theme.bgCard} ${theme.bgCardHover} rounded-2xl transition-all group`}
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2 group-hover:opacity-80 transition-colors`}>
              View Dashboard
            </h3>
            <p className={`${theme.textSecondary} mb-4 text-sm`}>
              Manage your active subscription, view payment history, and see admin controls.
            </p>
            <div className={`${theme.textAccent} font-semibold`}>
              Open Dashboard →
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/examples/02-gasless-transfer" className={`${theme.textAccent} hover:opacity-80`}>
            ← Previous: Recipe 02
          </Link>
          <Link href="/examples/03-subscription-service/subscribe" className={theme.btnPrimary}>
            Try the Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
