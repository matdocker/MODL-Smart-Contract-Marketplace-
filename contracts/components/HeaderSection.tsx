// components/HeaderSection.tsx
'use client';
import ModlBalance from './ModlBalance';
import TierBadge from './TierBadge';
import CreateProjectModal from './CreateProjectModal';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';

export default function HeaderSection() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get('templateId');

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Your <span className="text-blue-700 dark:text-blue-400">Projects</span>
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your modules, tiers, and project creation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <ModlBalance />
        </div>

        <div className="flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TierBadge address={address!} />
        </div>

        <div className="flex items-center">
          <CreateProjectModal preselectedTemplateId={preselectedTemplateId} />
        </div>
      </div>
    </div>
  );
}
