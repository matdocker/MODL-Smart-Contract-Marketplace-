// pages/dashboard.tsx
'use client';

import Navbar from '@/components/navbar';
import ModlBalance from '@/components/ModlBalance';
import TierBadge from '@/components/TierBadge';
import ProjectCard from '@/components/ProjectCard';
import Skeleton from '@/components/skeleton';
import { useProjects } from '@/hooks/useProjects';
import { useModlToken } from '@/hooks/useModlToken';
import { useTierSystem } from '@/hooks/useTierSystem';
import { useAccount } from 'wagmi';

export default function DashboardPage() {
  const { address } = useAccount();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { balance, isLoading: balanceLoading } = useModlToken(address);
  const { tier, isLoading: tierLoading } = useTierSystem(address);

  return (
    <div className="min-h-screen bg-surface dark:bg-darkSurface">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow">
            <h2 className="text-lg font-semibold mb-2">MODL Balance</h2>
            {balanceLoading ? <Skeleton width="w-24" /> : <ModlBalance balance={balance} />}
          </div>

          <div className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow">
            <h2 className="text-lg font-semibold mb-2">Your Tier</h2>
            {tierLoading ? <Skeleton width="w-24" /> : <TierBadge tier={tier} />}
          </div>

          <div className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow">
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            <p className="truncate">{address}</p>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            {/* You can add a button here to open a "Create Project" modal */}
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, idx) => (
                <Skeleton key={idx} height="h-40" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-gray-500">No projects found. Start by creating one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.projectId.toString()} project={project} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
