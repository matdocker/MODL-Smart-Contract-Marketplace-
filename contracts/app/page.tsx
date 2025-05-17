'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// main.jsx or main.tsx
// import './global.css';
// import { useDarkMode } from '../theme/ThemeProvider';

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-white to-gray-100 text-gray-900">
      <div className="text-center animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">Welcome to <span className="text-blue-600">MODULR</span></h1>
        <p className="text-lg mb-8 text-gray-600">
          Build and deploy gasless modular dApps on <span className="font-medium">Base Testnet</span>.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </main>
  );
}
