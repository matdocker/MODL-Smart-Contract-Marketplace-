'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Moon, Sun, Rocket } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useGasless } from '@/components/GaslessProvider';

export default function TopNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { gaslessEnabled } = useGasless();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Left: Nav links */}
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-gray-900 dark:text-gray-100">
          MODULR
        </Link>
        <Link href="/about" className="text-sm text-gray-700 dark:text-gray-300 hover:underline">
          About
        </Link>
        <Link href="/docs" className="text-sm text-gray-700 dark:text-gray-300 hover:underline">
          Docs
        </Link>
        <Link href="/support" className="text-sm text-gray-700 dark:text-gray-300 hover:underline">
          Support
        </Link>
      </nav>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* 🚀 Gasless icon with tooltip */}
        {gaslessEnabled && (
          <div
            className="relative group cursor-help"
            title="Gasless mode is enabled 🚀 Your transactions will be gas-free!"
          >
            <Rocket className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {mounted ? (
            resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-100" />
            ) : (
              <Moon className="h-5 w-5 text-gray-900" />
            )
          ) : (
            <Moon className="h-5 w-5 text-gray-900" /> // fallback to match SSR
          )}
        </button>

        <ConnectButton />
      </div>
    </header>
  );
}
