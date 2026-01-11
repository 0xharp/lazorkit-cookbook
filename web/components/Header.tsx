'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useBalances } from '@/hooks/useBalances';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { shortenAddress } from '@/lib/solana-utils';

export default function Header() {
    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        solBalance,
        usdcBalance,
        loading,
        fetchBalances,
        reset: resetBalances,
    } = useBalances(isConnected ? wallet?.smartWallet : null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const handleDisconnect = () => {
        disconnect();
        setShowDropdown(false);
        resetBalances();
    };

    return (
        <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
            <div className="container mx-auto px-4 py-3 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Left - Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-3xl">🧪</span>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-white">LazorKit Cookbook</h1>
                            <p className="text-xs text-gray-400">Practical Recipes using LazorKit SDK</p>
                        </div>
                        <div className="sm:hidden">
                            <h1 className="text-base font-bold text-white">LazorKit</h1>
                        </div>
                    </Link>

                    {/* Devnet Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-xs font-semibold hidden sm:inline">Live on Devnet</span>
                        <span className="text-green-300 text-xs font-semibold sm:hidden">Devnet</span>
                    </div>

                    {/* Right - Wallet */}
                    {isConnected && wallet ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                            >
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-white text-sm font-mono hidden sm:inline">
                  {shortenAddress(wallet.smartWallet)}
                </span>
                                <span className="text-white text-sm font-mono sm:hidden">
                  {shortenAddress(wallet.smartWallet, 3)}
                </span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                    {/* Wallet Address */}
                                    <div className="p-4 border-b border-white/10">
                                        <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs font-mono text-white flex-1 overflow-x-auto">
                                                {wallet.smartWallet}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(wallet.smartWallet);
                                                    alert('Address copied!');
                                                }}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    {/* Balances */}
                                    <div className="p-4 border-b border-white/10">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-xs text-gray-400">Balances</p>
                                            <button
                                                onClick={fetchBalances}
                                                disabled={loading}
                                                className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                                                {loading ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">SOL</span>
                                                <span className="text-sm font-semibold text-white">
                          {solBalance !== null ? solBalance.toFixed(4) : '...'}
                        </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">USDC</span>
                                                <span className="text-sm font-semibold text-white">
                          {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-3 space-y-2">

                                    <a  href={`https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full px-4 py-2 text-sm text-center text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                        >
                                        🔍 View on Explorer
                                    </a>
                                    <button
                                        onClick={handleDisconnect}
                                        className="w-full px-4 py-2 text-sm text-center text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                                    >
                                        🔌 Disconnect
                                    </button>
                                </div>
                                </div>
                                )}
                        </div>
                        ) : (
                        <button
                        onClick={connect}
                     disabled={connecting}
                     className="px-4 md:px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all text-sm shadow-lg shadow-purple-500/50 disabled:opacity-50"
                >
              <span className="hidden sm:inline">
                {connecting ? 'Connecting...' : '🔑 Connect Wallet'}
              </span>
                    <span className="sm:hidden">
                {connecting ? '...' : 'Connect'}
              </span>
                </button>
                )}
            </div>
        </div>
</header>
);
}