'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBalances } from '@/hooks/useBalances';
import { useLazorkitWalletConnect } from '@/hooks/useLazorkitWalletConnect';
import { shortenAddress } from '@/lib/solana-utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';

export default function Header() {
    const { wallet, isConnected, connect, disconnect, connecting } = useLazorkitWalletConnect();
    const { theme, toggleTheme, isLazorkit } = useTheme();
    const themeClasses = useThemeClasses();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        solBalance,
        usdcBalance,
        loading,
        fetchBalances,
        reset: resetBalances
    } = useBalances(isConnected ? wallet?.smartWallet : null)

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
        <header className={`sticky top-0 z-50 backdrop-blur-lg border-b ${isLazorkit ? 'bg-white/80 border-gray-200' : 'bg-gray-900/80 border-white/10'}`}>
            <div className="container mx-auto px-4 py-3 max-w-7xl">
                <div className="flex items-center justify-between">
                    {/* Left - Logo */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Image
                            src={isLazorkit ? "/LazorKitLogoLight.png" : "/LazorKitLogoDark.png"}
                            alt="LazorKit Logo"
                            width={40}
                            height={40}
                            className="object-contain" // Changed from rounded-full to object-contain to prevent cutting
                        />
                        <div className="hidden sm:block">
                            <h1 className={`text-lg font-bold ${isLazorkit ? 'text-gray-900' : 'text-white'}`}>
                                <span className={themeClasses.textAccent}>LazorKit</span> Cookbook
                            </h1>
                            <p className={`text-xs ${isLazorkit ? 'text-gray-500' : 'text-gray-400'}`}>Practical Recipes using LazorKit SDK</p>
                        </div>
                        <div className="sm:hidden">
                            <h1 className={`text-base font-bold ${isLazorkit ? 'text-gray-900' : 'text-white'}`}>LazorKit</h1>
                        </div>
                    </Link>

                    {/* Center - Devnet Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className={`text-xs font-semibold hidden sm:inline ${isLazorkit ? 'text-green-600' : 'text-green-300'}`}>Live on Devnet</span>
                        <span className={`text-xs font-semibold sm:hidden ${isLazorkit ? 'text-green-600' : 'text-green-300'}`}>Devnet</span>
                    </div>

                    {/* Right - Theme Toggle + Wallet */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-all ${isLazorkit ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                            title={`Switch to ${isLazorkit ? 'Dark' : 'LazorKit'} Theme`}
                        >
                            {isLazorkit ? '🌙' : '☀️'}
                        </button>

                        {/* Wallet */}
                        {isConnected && wallet ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all border ${isLazorkit
                                        ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-900'
                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                >
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-mono hidden sm:inline">
                                        {shortenAddress(wallet.smartWallet)}
                                    </span>
                                    <span className="text-sm font-mono sm:hidden">
                                        {shortenAddress(wallet.smartWallet, 3)}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''} ${isLazorkit ? 'text-gray-500' : 'text-gray-400'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown */}
                                {showDropdown && (
                                    <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl overflow-hidden border ${isLazorkit ? 'bg-white border-gray-200' : 'bg-gray-800 border-white/10'
                                        }`}>
                                        {/* Wallet Address */}
                                        <div className={`p-4 border-b ${isLazorkit ? 'border-gray-200' : 'border-white/10'}`}>
                                            <p className={`text-xs mb-1 ${isLazorkit ? 'text-gray-500' : 'text-gray-400'}`}>Wallet Address</p>
                                            <div className="flex items-center gap-2">
                                                <code className={`text-xs font-mono flex-1 overflow-x-auto ${isLazorkit ? 'text-gray-900' : 'text-white'}`}>
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
                                        <div className={`p-4 border-b ${isLazorkit ? 'border-gray-200' : 'border-white/10'}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <p className={`text-xs ${isLazorkit ? 'text-gray-500' : 'text-gray-400'}`}>Balances</p>
                                                <button
                                                    onClick={fetchBalances}
                                                    disabled={loading}
                                                    className={`text-xs ${isLazorkit ? 'text-[#7857FF] hover:text-[#674BF7]' : 'text-purple-400 hover:text-purple-300'} disabled:opacity-50 flex items-center gap-1`}
                                                >
                                                    <span className={loading ? 'animate-spin' : ''}>🔄</span>
                                                    {loading ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm ${isLazorkit ? 'text-gray-600' : 'text-gray-300'}`}>SOL</span>
                                                    <span className={`text-sm font-semibold ${isLazorkit ? 'text-gray-900' : 'text-white'}`}>
                                                        {solBalance !== null ? solBalance.toFixed(4) : '...'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm ${isLazorkit ? 'text-gray-600' : 'text-gray-300'}`}>USDC</span>
                                                    <span className={`text-sm font-semibold ${isLazorkit ? 'text-gray-900' : 'text-white'}`}>
                                                        {usdcBalance !== null ? usdcBalance.toFixed(2) : '...'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-3 space-y-2">
                                            <a
                                                href={`https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`block w-full px-4 py-2 text-sm text-center rounded-lg transition-all ${isLazorkit
                                                    ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                                    : 'text-white bg-white/5 hover:bg-white/10'
                                                    }`}
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
                                className={`px-4 md:px-6 py-2 ${isLazorkit
                                    ? 'bg-[#7857FF] hover:bg-[#674BF7] text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                    } rounded-lg font-semibold transition-all text-sm disabled:opacity-50`}
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
            </div>
        </header>
    );
}