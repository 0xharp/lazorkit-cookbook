'use client';

import { useThemeClasses } from '@/hooks/useThemeClasses';

export default function Footer() {
  const theme = useThemeClasses();

  return (
    <footer className={`border-t ${theme.borderSubtle} py-6 ${theme.bgCardAlt}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          {/* Left - Built with */}
          <div className="text-center md:text-left">
            <span className={theme.textSecondary}>
              Built using{' '}
              <a
                href="https://lazorkit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.textAccent} hover:opacity-80 font-semibold`}
              >
                LazorKit SDK
              </a>
              {' '}•{' '}
              <a
                href="https://docs.lazorkit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.textAccent} hover:opacity-80 font-semibold`}
              >
                Docs ↗
              </a>
            </span>
          </div>

          {/* Center - Bounty */}
          <div className="text-center">
            <span className={theme.textSecondary}>
              For{' '}
              <a
                href="https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.textAccent} hover:opacity-80 font-semibold`}
              >
                Superteam Bounty
              </a>
            </span>
          </div>

          {/* Right - Built by */}
          <div className="text-center md:text-right">
            <span className={theme.textSecondary}>
              By{' '}
              <a
                href="https://x.com/0xharp"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.textAccent} hover:opacity-80 font-semibold`}
              >
                0xharp
              </a>
              {' '}•{' '}
              <a
                href="https://github.com/0xharp/lazorkit-cookbook"
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.textAccent} hover:opacity-80 font-semibold`}
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
