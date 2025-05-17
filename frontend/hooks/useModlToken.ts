'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { modlTokenAddress } from '../constants/index';
import MODL_TOKEN from '../abi/MODLToken.json';
import { Abi } from 'viem';

const MODL_TOKEN_ABI = MODL_TOKEN.abi as Abi;

export function useModlToken() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !publicClient) return;

      try {
        setLoading(true);
        const raw = await publicClient.readContract({
          address: modlTokenAddress,
          abi: MODL_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [address],
        });

        const formatted = formatUnits(raw as bigint, 18); // returns a string
        setBalance(formatted);
      } catch (error) {
        console.error('Error fetching MODL balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address, publicClient]);

  return {
    balance,
    loading,
  };
}
