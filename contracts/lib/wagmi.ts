'use client';

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';

// 🔐 WalletConnect Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID');
}

// 🌍 Chain selection with correct tuple type
const isTestnet = process.env.NEXT_PUBLIC_ENV === 'testnet';
export const chains = (isTestnet ? [baseSepolia] : [base]) as [typeof base | typeof baseSepolia];

// ✅ Wagmi + RainbowKit config
export const wagmiConfig = getDefaultConfig({
  appName: 'MODULR',
  projectId,
  chains,
  ssr: true, // Keep true if using SSR
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// React Query setup
export const queryClient = new QueryClient();
