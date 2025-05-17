// lib/hooks/useDeploymentManager.ts
'use client';

import { useAccount, useWalletClient } from 'wagmi';
import { useCallback } from 'react';
import { Abi } from 'viem';
import DEPLOYMENT_MANAGER from '../abi/DeploymentManager.json';
import { deploymentManagerAddress } from '../constants';

const DEPLOYMENT_MANAGER_ABI = DEPLOYMENT_MANAGER.abi as Abi;

export function useDeploymentManager() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const deployTemplateToProject = useCallback(
    async (
      projectId: bigint,
      templateId: `0x${string}`,
      initData: `0x${string}`,
      metadata: string
    ) => {
      if (!walletClient || !address)
        throw new Error('Wallet not connected');

      const hash = await walletClient.writeContract({
        address: deploymentManagerAddress,
        abi: DEPLOYMENT_MANAGER_ABI as Abi,
        functionName: 'deployTemplateToProject',
        args: [projectId, templateId, initData, metadata],
        account: address,
      });

      return hash;
    },
    [walletClient, address]
  );

  return {
    deployTemplateToProject,
  };
}
