'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { tierSystemAddress } from '../constants/index';
import TIER_SYSTEM from '../abi/TierSystem.json';
import { Abi } from 'viem';

const TIER_SYSTEM_ABI = TIER_SYSTEM.abi as Abi;

export function useTierSystem() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tier, setTier] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    publicClient.readContract({
      address: tierSystemAddress,
      abi: TIER_SYSTEM_ABI,
      functionName: 'getTier',
      args: [address],
    })
      .then(setTier)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [address, publicClient]);

  return { tier, isLoading, error };
}
