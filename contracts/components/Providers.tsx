'use client';

import { WagmiProvider } from 'wagmi';
import {
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

import { wagmiConfig, chains } from '@/lib/wagmi';

// Create a QueryClient instance once
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider  theme={lightTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
