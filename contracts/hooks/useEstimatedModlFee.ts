import { usePublicClient, useAccount } from 'wagmi';
import { Abi } from 'viem';
import FEE_MANAGER_ABI from '@/abi/FeeManager.json';

const abi = FEE_MANAGER_ABI.abi as Abi;
const FEE_MANAGER_ADDRESS = process.env.FEE_MANAGER_ADDRESS!;

export function useEstimatedModlFee() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  async function estimate(gasUnits: number): Promise<{
    modlFee: string;
    discountBps: number;
    userTier: number;
  } | null> {
    if (!publicClient || !address) return null;

    try {
      const [modlFee, discountBps, userTier] = await publicClient.readContract({
        address:'0x56c69e72892bca0D405c5230a9512865Bd327B9a',
        abi,
        functionName: 'calculateFinalFee',
        args: [gasUnits, address],
      }) as [bigint, bigint, number];;

      return {
        modlFee: (BigInt(modlFee).toString()),
        discountBps: Number(discountBps),
        userTier: Number(userTier),
      };
    } catch (err) {
      console.error('❌ Failed to estimate MODL fee:', err);
      return null;
    }
  }

  return { estimate };
}
