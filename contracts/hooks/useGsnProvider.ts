// hooks/useGsnProvider.ts
'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { RelayProvider } from '@opengsn/provider';
import { useAccount } from 'wagmi';

export function useGsnProvider(paymasterAddress: string) {
  const { isConnected } = useAccount();
  const [gsnProvider, setGsnProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    async function setup() {
      if (!isConnected || !window.ethereum) return;

      const relayProvider = await RelayProvider.newProvider({
        provider: window.ethereum,
        config: { paymasterAddress },
      }).init();

      const browserProvider = new BrowserProvider(relayProvider as any);
      setGsnProvider(browserProvider);
    }

    setup();
  }, [isConnected, paymasterAddress]);

  return gsnProvider;
}
