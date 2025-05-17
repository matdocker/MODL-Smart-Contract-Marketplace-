// hooks/useStakeModl.ts
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Abi, parseUnits } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import MODL_ABI from '@/abi/MODLToken.json';
import TIER_SYSTEM_ABI from '@/abi/TierSystem.json';

const MODL_TOKEN_ADDRESS = '0xYourModlTokenAddress';
const TIER_SYSTEM_ADDRESS = '0xYourTierSystemAddress';

export function useStakeModl() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  async function approve(amount: string) {
    const amountInWei = parseUnits(amount, 18);

    const { hash } = await writeContract({
      address: MODL_TOKEN_ADDRESS,
      abi: MODL_ABI as Abi,
      functionName: 'approve',
      args: [TIER_SYSTEM_ADDRESS, amountInWei],
    });

    await waitForTransactionReceipt({ hash });
    console.log('✅ MODL approved');
  }

  async function stake(amount: string) {
    const amountInWei = parseUnits(amount, 18);

    const { hash } = await writeContract({
      address: TIER_SYSTEM_ADDRESS,
      abi: TIER_SYSTEM_ABI as Abi,
      functionName: 'stake',
      args: [amountInWei],
    });

    await waitForTransactionReceipt({ hash });
    console.log('✅ MODL staked');
  }

  async function getUserTier() {
    if (!address) return null;

    return await readContract({
      address: TIER_SYSTEM_ADDRESS,
      abi: TIER_SYSTEM_ABI as Abi,
      functionName: 'getTier',
      args: [address],
    });
  }

  return { approve, stake, getUserTier };
}
