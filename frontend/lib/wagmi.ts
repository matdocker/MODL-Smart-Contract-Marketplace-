// lib/wagmi.ts
'use client';

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';

// 🔐 WalletConnect Project ID (from .env)
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID');
}

// 🌍 Environment-based chain switching
const isTestnet = process.env.NEXT_PUBLIC_ENV === 'testnet';
export const chains = isTestnet ? [baseSepolia] : [base];

// ✅ Wagmi + RainbowKit config
export const wagmiConfig = getDefaultConfig({
  appName: 'MODULR',
  projectId,
  chains,
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// 🧠 React Query setup
export const queryClient = new QueryClient();
