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

  useEffect(() => {
    if (!address || !publicClient) return;

    publicClient.readContract({
      address: tierSystemAddress,
      abi: TIER_SYSTEM_ABI as Abi,
      functionName: 'getTier',
      args: [address],
    }).then(setTier);
  }, [address, publicClient]);

  return { tier };
}
