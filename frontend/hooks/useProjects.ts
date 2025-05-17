'use client';

import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWatchContractEvent,
} from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { Abi } from 'viem';
import DEPLOYMENT_MANAGER from '../abi/DeploymentManager.json';
import { deploymentManagerAddress } from '../constants';
import { base, baseSepolia } from 'wagmi/chains';

const isTestnet = process.env.NEXT_PUBLIC_ENV === 'testnet';
const chain = isTestnet ? baseSepolia : base;
const DEPLOYMENT_MANAGER_ABI = DEPLOYMENT_MANAGER.abi as Abi;

interface Project {
  projectId: bigint;
  name: string;
  owner: string;
  moduleAddresses: string[];
}

export function useProjects() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!address || !publicClient) return;
    setLoading(true);

    try {
      const result = await publicClient.readContract({
        address: deploymentManagerAddress,
        abi: DEPLOYMENT_MANAGER_ABI,
        functionName: 'getUserProjects',
        args: [address],
      });

      setProjects(result as Project[]);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  const createProject = useCallback(
    async (name: string) => {
      if (!walletClient || !address) throw new Error('Wallet not connected');

      const txHash = await walletClient.writeContract({
        address: deploymentManagerAddress,
        abi: DEPLOYMENT_MANAGER_ABI,
        functionName: 'createProject',
        args: [name],
        account: address,
        chain,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      return txHash;
    },
    [walletClient, address, publicClient]
  );

  const deleteProject = async (projectId: bigint) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
  
    const txHash = await walletClient.writeContract({
      address: deploymentManagerAddress,
      abi: DEPLOYMENT_MANAGER_ABI,
      functionName: 'deleteProject',
      args: [projectId],
      account: address,
      chain,
    });
  
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  
    return txHash;
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 🔁 Auto-update when ProjectCreated event is fired
  useWatchContractEvent({
    address: deploymentManagerAddress,
    abi: DEPLOYMENT_MANAGER_ABI,
    eventName: 'ProjectCreated',
    onLogs: (logs) => {
      console.log('📡 ProjectCreated event detected:', logs);
      fetchProjects();
    },
  });

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
  };
}
