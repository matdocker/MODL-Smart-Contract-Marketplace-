'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
import { useTierSystem } from '@/hooks/useTierSystem';

type GaslessContextType = {
  gaslessEnabled: boolean;
  setGaslessEnabled: (enabled: boolean) => void;
  tier: number;
  relayerUrl: string;
  relayerOnline: boolean;
};

const GaslessContext = createContext<GaslessContextType>({
  gaslessEnabled: false,
  setGaslessEnabled: () => {
    throw new Error('setGaslessEnabled must be used within GaslessProvider');
  },
  tier: 1,
  relayerUrl: '',
  relayerOnline: true,
});

export function useGasless() {
  return useContext(GaslessContext);
}

type GaslessProviderProps = {
  children: ReactNode;
};

export function GaslessProvider({ children }: GaslessProviderProps) {
  const [gaslessEnabled, setGaslessEnabled] = useState(false);
  const [tier, setTier] = useState(1);
  const [relayerOnline, setRelayerOnline] = useState(true);
  const { address } = useAccount();
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || '';
  const { tier: userTier } = useTierSystem();

  // Restore saved gasless state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gaslessEnabled');
    if (saved === 'true') {
      setGaslessEnabled(true);
      console.log('[DEBUG] Restored gaslessEnabled from localStorage → true');
    }
  }, []);

  // Persist gaslessEnabled changes
  useEffect(() => {
    localStorage.setItem('gaslessEnabled', String(gaslessEnabled));
    console.log('[DEBUG] Gasless state changed →', gaslessEnabled);
  }, [gaslessEnabled]);

  // Sync tier from hook
  useEffect(() => {
    if (userTier !== null) setTier(userTier);
  }, [userTier]);

  // Disable gasless if user drops below Tier 1
  useEffect(() => {
    if (tier < 0 && gaslessEnabled) { //CHANGE BACK TO - Tier < 1
      console.warn('[GaslessProvider] Tier below 1 — disabling gasless mode');
      setGaslessEnabled(false);
    }
  }, [tier, gaslessEnabled]);

  // Relayer health check
  useEffect(() => {
    if (!relayerUrl) {
      console.warn('[GaslessProvider] Missing NEXT_PUBLIC_RELAYER_URL');
      setRelayerOnline(false);
      return;
    }
    fetch(`${relayerUrl}/health`)
      .then((res) => setRelayerOnline(res.ok))
      .catch(() => setRelayerOnline(false));
  }, [relayerUrl]);

  return (
    <GaslessContext.Provider
      value={{
        gaslessEnabled,
        setGaslessEnabled,
        tier,
        relayerUrl,
        relayerOnline,
      }}
    >
      {children}
    </GaslessContext.Provider>
  );
}
