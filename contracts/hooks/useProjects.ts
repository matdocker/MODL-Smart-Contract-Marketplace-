// Updated useProjects hook to include MODL fee preview integration

'use client';

import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWatchContractEvent,
} from 'wagmi';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Abi, encodeFunctionData, formatUnits } from 'viem';
import DEPLOYMENT_MANAGER from '../abi/DeploymentManager.json';
import { deploymentManagerAddress } from '../constants';
import { base, baseSepolia } from 'wagmi/chains';
import { useGasless } from '@/components/GaslessProvider';
import { Contract, BrowserProvider, Eip1193Provider } from 'ethers';
import { useEstimatedModlFee } from '@/hooks/useEstimatedModlFee';

const isTestnet = process.env.NEXT_PUBLIC_ENV === 'testnet';
const chain = isTestnet ? baseSepolia : base;
const DEPLOYMENT_MANAGER_ABI = DEPLOYMENT_MANAGER.abi as Abi;

export interface Project {
  projectId: bigint;
  name: string;
  owner: string;
  moduleAddresses: string[];
  moduleCount?: number;
}

function formatModl(modlFee: bigint): string {
  return Number(formatUnits(modlFee, 18)).toFixed(4);
}

export function useProjects() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { gaslessEnabled } = useGasless();
  const { estimate } = useEstimatedModlFee();
  const queryClient = useQueryClient();

  async function getContractWithSigner() {
    if (!walletClient) throw new Error('No wallet client');
    const ethersProvider = new BrowserProvider(window.ethereum as unknown as Eip1193Provider);
    const signer = await ethersProvider.getSigner();
    return new Contract(deploymentManagerAddress, DEPLOYMENT_MANAGER_ABI as any, signer);
  }

  async function sendViaRelayer(encodedData: string, address: string): Promise<string> {
    const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL!;
    const paymaster = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS!;
    const target = deploymentManagerAddress;
    const gasLimit = 200_000;

    const payload = { paymaster, target, encodedData, gasLimit, user: address };

    toast.loading('Relaying transaction...', { id: 'relay' });
    const res = await fetch(`${relayerUrl}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    const result = JSON.parse(rawText);

    if (!res.ok || !result.txHash?.startsWith('0x')) {
      const reason = result.error || `Unexpected response: ${rawText}`;
      toast.error(`❌ Relayer error: ${reason}`, { id: 'relay' });
      throw new Error(reason);
    }

    toast.success(`✅ Transaction relayed!`, { id: 'relay' });
    return result.txHash;
  }

  const fetchProjects = async (): Promise<Project[]> => {
    if (!address || !publicClient) return [];
    const rawProjects = await publicClient.readContract({
      address: deploymentManagerAddress,
      abi: DEPLOYMENT_MANAGER_ABI,
      functionName: 'getUserProjects',
      args: [address],
    });

    const enriched = await Promise.all(
      (rawProjects as Project[]).map(async (project) => {
        try {
          const modules = await publicClient.readContract({
            address: deploymentManagerAddress,
            abi: DEPLOYMENT_MANAGER_ABI,
            functionName: 'getProjectModules',
            args: [project.projectId],
          });
          return { ...project, moduleCount: (modules as any[]).length };
        } catch {
          return { ...project, moduleCount: 0 };
        }
      })
    );
    return enriched;
  };

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects', address],
    queryFn: fetchProjects,
    enabled: !!address,
  });

  async function createProjectOnChain(name: string) {
    if (!address) throw new Error('Wallet not connected');

    const encodedData = encodeFunctionData({
      abi: DEPLOYMENT_MANAGER_ABI,
      functionName: 'createProject',
      args: [name],
    });

    if (gaslessEnabled) {
      const preview = await estimate(200_000);
      if (preview) {
        toast(`🪙 MODL Fee: ${formatModl(BigInt(preview.modlFee))} MODL (Tier ${preview.userTier}, ${preview.discountBps / 100}%)`, {
          id: 'fee-preview', duration: 5000
        });
      }

      try {
        return await sendViaRelayer(encodedData, address);
      } catch (err) {
        toast.error('Gasless failed, falling back to wallet.');
      }
    }

    const contract = await getContractWithSigner();
    const tx = await contract.createProject(name, { gasLimit: 200000 });
    await tx.wait();
    return tx.hash;
  }

  async function deleteProjectOnChain(projectId: bigint) {
    if (!address) throw new Error('Wallet not connected');

    const encodedData = encodeFunctionData({
      abi: DEPLOYMENT_MANAGER_ABI,
      functionName: 'deleteProject',
      args: [projectId],
    });

    if (gaslessEnabled) {
      const preview = await estimate(200_000);
      if (preview) {
        toast(`🪙 MODL Fee: ${formatModl(BigInt(preview.modlFee))} MODL (Tier ${preview.userTier}, ${preview.discountBps / 100}%)`, {
          id: 'fee-preview', duration: 5000
        });
      }

      try {
        return await sendViaRelayer(encodedData, address);
      } catch (err) {
        toast.error('Gasless failed, falling back to wallet.');
      }
    }

    const contract = await getContractWithSigner();
    const tx = await contract.deleteProject(projectId, { gasLimit: 200000 });
    await tx.wait();
    return tx.hash;
  }

  const createProject = useMutation({
    mutationFn: createProjectOnChain,
    onSuccess: () => {
      toast.success('✅ Project created');
      queryClient.invalidateQueries({ queryKey: ['projects', address] });
    },
    onError: (error: any) => {
      toast.error(`❌ Failed to create project: ${error.message}`);
    },
  });

  const deleteProject = useMutation({
    mutationFn: deleteProjectOnChain,
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', address] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', address]);
      queryClient.setQueryData<Project[]>(['projects', address], (old) =>
        old?.filter((p) => p.projectId !== projectId) ?? []
      );
      return { previousProjects };
    },
    onError: (error, _projectId, context) => {
      toast.error(`❌ Failed to delete project: ${error.message}`);
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', address], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', address] });
    },
  });

  useWatchContractEvent({
    address: deploymentManagerAddress,
    abi: DEPLOYMENT_MANAGER_ABI,
    eventName: 'ProjectCreated',
    onLogs: () => queryClient.invalidateQueries({ queryKey: ['projects', address] }),
  });

  useWatchContractEvent({
    address: deploymentManagerAddress,
    abi: DEPLOYMENT_MANAGER_ABI,
    eventName: 'ProjectDeleted',
    onLogs: () => queryClient.invalidateQueries({ queryKey: ['projects', address] }),
  });

  return {
    projects,
    loading: isLoading,
    refetchProjects: refetch,
    createProject: createProject.mutateAsync,
    deleteProject: deleteProject.mutateAsync,
  };
}
