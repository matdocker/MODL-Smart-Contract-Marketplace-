'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig, queryClient } from '@/lib/wagmi';
import { ThemeProvider } from '@/theme/ThemeProvider';
import LayoutShell from '@/components/LayoutShell';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LayoutShell>{children}</LayoutShell>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
