import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LazorkitProvider } from "@/providers/LazorkitProvider";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "LazorKit Cookbook",
    description: "Practical recipes for building Solana dApps with LazorKit",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <LazorkitProvider>
            <Header />
            <main className="min-h-[calc(100vh-200px)]">
                {children}
            </main>
            <Footer />
        </LazorkitProvider>
        </body>
        </html>
    );
}