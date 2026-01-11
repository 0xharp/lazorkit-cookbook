import Link from 'next/link';

export default function Recipe03OverviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl">💰</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
                Recipe 03: Subscription Service
              </h1>
            </div>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Automated recurring payments demonstrating blockchain-native subscriptions with LazorKit
          </p>
        </div>

        {/* The Magic: Sign Once */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl">✨</span>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  The Magic: Sign Once with Face ID, Never Again
                </h2>
                <p className="text-lg text-purple-200 mb-4">
                  This is what makes blockchain subscriptions incredible:
                </p>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <p className="font-semibold text-white">User subscribes with Face ID (gasless via LazorKit)</p>
                      <p className="text-sm text-gray-400">One Face ID authentication to delegate token spending permission</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <p className="font-semibold text-white">Automatic charges every billing cycle</p>
                      <p className="text-sm text-gray-400">Backend service charges the user automatically - no signatures needed!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                      <p className="font-semibold text-white">Cancel anytime (also gasless)</p>
                      <p className="text-sm text-gray-400">One click to cancel, rent gets refunded automatically</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 font-semibold flex items-center gap-2">
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
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">What We're Building</h2>
            <p className="text-gray-300 mb-4 text-sm">
              An automated subscription billing system demonstrating how blockchain-native recurring payments work with LazorKit integration:
            </p>
            <ul className="space-y-3 text-sm md:text-base text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1 flex-shrink-0">✓</span>
                <span>Subscribe with minimal friction (gasless flow via LazorKit)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1 flex-shrink-0">✓</span>
                <span>Get charged automatically every billing cycle (no user signature needed!)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1 flex-shrink-0">✓</span>
                <span>Cancel anytime with rent refunds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1 flex-shrink-0">✓</span>
                <span>View subscription history and payment details</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>This is a working proof-of-concept</strong> showcasing a novel integration pattern with LazorKit.
              </p>
            </div>
          </div>

          {/* The Core Innovation */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">The Core Innovation: Token Delegation</h2>
            <p className="text-sm text-gray-300 mb-4">
              The key mechanism enabling automatic recurring payments is Solana's token delegation:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-green-300">
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
            <p className="text-xs text-gray-400">
              After this one-time approval with Face ID, the merchant can charge the user automatically without requiring signatures for each payment. This is how blockchain-native subscriptions work - transparent, auditable, and user-controlled.
            </p>
          </div>
        </div>

        {/* LazorKit Integration Benefits */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🚀</span> LazorKit Integration Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span>1.</span> Simplified Onboarding
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  User subscribes with Face ID - LazorKit handles the complexity:
                </p>
                <div className="bg-gray-900 rounded p-3 text-xs">
                  <code className="text-green-300">
{`await signAndSendTransaction({
  instructions: [
    initSubscriptionIx,
    delegateTokensIx
  ],
});`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span>2.</span> Gasless User Actions
                </h3>
                <p className="text-sm text-gray-300">
                  LazorKit's paymaster covers gas fees for:
                </p>
                <ul className="text-sm text-gray-300 space-y-1 mt-2">
                  <li>• Canceling subscription</li>
                  <li>• Updating preferences</li>
                  <li>• Viewing subscription status</li>
                </ul>
                <p className="text-xs text-green-300 mt-2">
                  This removes friction from the user experience.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span>3.</span> Smart Wallet Persistence
                </h3>
                <p className="text-sm text-gray-300">
                  LazorKit's smart wallets maintain consistent addresses across sessions, important for:
                </p>
                <ul className="text-sm text-gray-300 space-y-1 mt-2">
                  <li>• Persistent token delegations</li>
                  <li>• Stable subscription PDAs</li>
                  <li>• Seamless user experience</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span>4.</span> Developer Experience
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Simple hooks instead of complex wallet adapter setup:
                </p>
                <div className="bg-gray-900 rounded p-2 text-xs">
                  <code className="text-purple-300">
                    const {'{ signAndSendTransaction }'} = useWallet();
                  </code>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  vs 50+ lines of traditional wallet adapter code
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Limitations & Production Roadmap */}
        <div className="mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <span>⚠️</span> Current Limitations & Production Roadmap
            </h2>
            <p className="text-sm text-yellow-200 mb-4">
              This is a <strong>proof-of-concept</strong> demonstrating feasibility. For production deployment, several enhancements would be needed:
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-base font-semibold text-white mb-2">
                  1. PDA Rent Costs (~0.002 SOL)
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Currently required to create subscription accounts</li>
                  <li>• Gets refunded on cancellation</li>
                </ul>
                <p className="text-xs text-yellow-300 mt-2">
                  <strong>Future Enhancement:</strong> Could be sponsored by deploying a custom paymaster for the subscription service, or enhanced LazorKit paymaster integration. Similar to how payment processors charge service fees in Web2.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-base font-semibold text-white mb-2">
                  2. Backend Charging Fees
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• The automated charging service pays transaction fees when pulling funds (this is not charged to the subscribed user)</li>
                  <li>• In production, these could be absorbed as business costs</li>
                  <li>• Could be covered by a service-specific paymaster</li>
                  <li>• Could offset against subscription revenue</li>
                </ul>
                <p className="text-xs text-yellow-300 mt-2">
                  Would explore options with LazorKit team to enhance paymaster capabilities.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Why This Matters:</strong> Even Web2 subscription services have infrastructure costs (payment processing fees, server costs, etc.). The difference here is transparency about where blockchain costs exist and how they can be optimized. This POC demonstrates that with thoughtful design and LazorKit integration, these costs can be minimized or abstracted away from end users.
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Architecture Overview</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 mb-2">Frontend (Next.js + LazorKit)</h3>
                <ul className="text-gray-300 space-y-1 text-xs">
                  <li>• Users connect via Face ID</li>
                  <li>• Subscribe with gasless flow</li>
                  <li>• Manage subscriptions easily</li>
                </ul>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">Backend Service</h3>
                <ul className="text-gray-300 space-y-1 text-xs">
                  <li>• Scans for due subscriptions</li>
                  <li>• Charges using delegated tokens</li>
                  <li>• Handles business logic</li>
                </ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-300 mb-2">Smart Contract (Anchor)</h3>
                <ul className="text-gray-300 space-y-1 text-xs">
                  <li>• Validates delegations</li>
                  <li>• Processes charges</li>
                  <li>• Manages cancellations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* What This Proves */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">What This Proves</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">Feasibility:</strong>
                  <p className="text-gray-300">Blockchain-native subscriptions work and can compete with Web2 UX</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">UX Improvement:</strong>
                  <p className="text-gray-300">LazorKit significantly simplifies user experience with Face ID and gasless flows</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">Developer Experience:</strong>
                  <p className="text-gray-300">Cleaner code, faster development with LazorKit's simple hooks</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">Integration Pattern:</strong>
                  <p className="text-gray-300">Shows how to combine LazorKit with custom on-chain programs</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">Production Path:</strong>
                  <p className="text-gray-300">Clear roadmap for full deployment with identified optimizations</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                <div>
                  <strong className="text-white">Novel Use Case:</strong>
                  <p className="text-gray-300">Demonstrates LazorKit can power sophisticated applications beyond simple transfers</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-200">
                This POC demonstrates that with LazorKit integration, building sophisticated on-chain applications becomes more accessible. The patterns shown here can be extended into a full production system with the enhancements outlined above.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/examples/03-subscription-service/subscribe"
            className="block p-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/50 rounded-2xl transition-all group"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              Try the Demo
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Subscribe to a plan and experience the full flow. Sign once with Face ID, then watch automatic charges happen without any further action!
            </p>
            <div className="text-purple-400 font-semibold">
              Start Subscribing →
            </div>
          </Link>

          <Link
            href="/examples/03-subscription-service/dashboard"
            className="block p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              View Dashboard
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Manage your active subscription, view payment history, and see the admin controls for triggering charges.
            </p>
            <div className="text-purple-400 font-semibold">
              Open Dashboard →
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link 
            href="/examples/02-gasless-transfer"
            className="text-purple-400 hover:text-purple-300"
          >
            ← Previous: Recipe 02
          </Link>
          <Link 
            href="/examples/03-subscription-service/subscribe"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all"
          >
            Try the Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
