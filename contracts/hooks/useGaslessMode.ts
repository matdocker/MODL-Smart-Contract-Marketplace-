// lib/hooks/useGaslessMode.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { RelayProvider } from '@opengsn/provider';
import { addresses } from '../constants';

// ⛽ Toggleable hook for switching between normal and gasless mode
export function useGaslessMode() {
  const [gasless, setGasless] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Toggle handler
  const toggleGasless = () => setGasless((prev) => !prev);

  useEffect(() => {
    const setupSigner = async () => {
      if (!walletClient || !address) return;

      const provider = new ethers.BrowserProvider(walletClient.transport);
      const normalSigner = await provider.getSigner(address);

      if (!gasless) {
        setSigner(normalSigner);
        return;
      }

      const gsnProvider = await RelayProvider.newProvider({
        provider: walletClient.transport, // pass the Viem transport directly
        config: {
          paymasterAddress: addresses.MODLPaymaster,
          loggerConfiguration: { logLevel: 'error' },
        },
      }).init();

      const gsnWrapped = new ethers.BrowserProvider(gsnProvider);
      const gsnSigner = await gsnWrapped.getSigner(address);
      setSigner(gsnSigner);
    };

    setupSigner();
  }, [gasless, walletClient, address]);

  return {
    gasless,
    toggleGasless,
    signer,
  };
}
