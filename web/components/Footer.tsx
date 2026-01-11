export default function Footer() {
    return (
        <footer className="border-t border-white/10 py-6 bg-gray-900">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
                    {/* Left - Built with */}
                    <div className="text-center md:text-left">
            <span className="text-gray-300">
              Built using{' '}
                <a
                    href="https://lazorkit.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                LazorKit SDK
              </a>
                {' '}•{' '}
                <a
                    href="https://docs.lazorkit.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                Docs ↗
              </a>
            </span>
                    </div>

                    {/* Center - Bounty */}
                    <div className="text-center">
            <span className="text-gray-300">
              For{' '}
                <a
                    href="https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                Superteam Bounty
              </a>
            </span>
                    </div>

                    {/* Right - Built by */}
                    <div className="text-center md:text-right">
            <span className="text-gray-300">
              By{' '}
                <a
                    href="https://x.com/0xharp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                0xharp
              </a>
                {' '}•{' '}
                <a
                    href="https://github.com/0xharp/lazorkit-cookbook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                ⭐ GitHub
              </a>
            </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}