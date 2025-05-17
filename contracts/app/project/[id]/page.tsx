'use client';

import { useParams } from 'next/navigation';
import { useReadContract } from 'wagmi';
import { DEPLOYMENT_MANAGER_ADDRESS } from '@/constants/contracts';
import ProjectModuleCard from '@/components/ProjectModuleCard';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';
import ProjectModuleSkeleton from '@/components/ProjectModuleSkeleton';
import DeploymentManagerAbi from '@/abi/DeploymentManager.json';
import { useAuditStatus } from '@/hooks/useAuditStatus';

type Module = {
  address: string;
  metadata: string;
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = id as string;

  const {
    data: rawModules,
    isPending: loadingModules,
  } = useReadContract({
    address: DEPLOYMENT_MANAGER_ADDRESS,
    abi: DeploymentManagerAbi,
    functionName: 'getProjectModules',
    args: [projectId],
    query: {
      watch: true,
    },
  });

  const modules: Module[] = rawModules
    ? rawModules.map((mod: any) => ({
        address: mod.deployedAddress as string,
        metadata: mod.metadata,
      }))
    : [];

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project: {formatAddress(projectId)}</h1>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {loadingModules ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <ProjectModuleSkeleton key={i} />
            ))}
        </div>
      ) : modules.length === 0 ? (
        <p className="text-gray-500">No modules deployed for this project yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => {
            const { isAudited, isLoading } = useAuditStatus(mod.address);

            return (
              <ProjectModuleCard
                key={i}
                address={mod.address}
                metadata={mod.metadata}
                audited={isAudited}
                auditLoading={isLoading}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
