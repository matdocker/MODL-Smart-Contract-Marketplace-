// components/WagmiClientWrapper.tsx
'use client';

import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { queryClient, wagmiConfig, chains } from '../lib/wagmi';
import { QueryClientProvider } from '@tanstack/react-query';

export default function WagmiClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
