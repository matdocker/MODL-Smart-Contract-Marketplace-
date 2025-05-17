'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useProjects } from '@/hooks/useProjects';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectCard from '@/components/ProjectCard';
import ModlBalance from '@/components/ModlBalance';
import TierBadge from '@/components/TierBadge';
import { useSearchParams } from 'next/navigation';
import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import toast from 'react-hot-toast';
import { useTemplates } from '@/hooks/useTemplates';
import { useRecentDeployments } from '@/hooks/useRecentDeployments';
import { formatTimestamp } from '@/lib/formatTimestamp';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import SkeletonBox from '@/components/SkeletonBox';
import { DEPLOYMENT_MANAGER_ADDRESS } from '@/constants/contracts';
import DeploymentManagerAbi from '@/abi/DeploymentManager.json';


export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { projects = [], loading: loadingProjects } = useProjects(address);
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get('templateId');
  const { templates = [] } = useTemplates();
  const { recentDeployments = [], loading: loadingDeployments } = useRecentDeployments();
  const { auditStats, auditStatsLoading, refetchAuditStats } = useAuditRegistry();

  const [enrichedProjects, setEnrichedProjects] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    const enrichProjects = async () => {
      setLoadingModules(true);
      const enriched = await Promise.all(
        projects.map(async (project) => {
          try {
            const modules = await publicClient.readContract({
              address: DEPLOYMENT_MANAGER_ADDRESS,
              abi: DeploymentManagerAbi.abi,
              functionName: 'getProjectModules',
              args: [project.projectId],
            });
            return { ...project, moduleCount: modules.length };
          } catch (err) {
            console.warn(`⚠ Failed to fetch modules for project ${project.projectId}`, err);
            return { ...project, moduleCount: 0 };
          }
        })
      );
      setEnrichedProjects(enriched);
      setLoadingModules(false);
    };
    if (projects.length > 0) enrichProjects();
  }, [projects, publicClient]);

  const handleRefreshStats = async () => {
    try {
      toast.loading('Refreshing audit stats...');
      await refetchAuditStats();
      toast.success('✅ Audit stats refreshed!');
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to refresh stats.');
    } finally {
      toast.dismiss();
    }
  };

  const topAuditedTemplates = templates
    .filter((t) => typeof t.auditCount === 'number')
    .sort((a, b) => (b.auditCount || 0) - (a.auditCount || 0))
    .slice(0, 5);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <div className="text-center">
          Please connect your wallet to view your dashboard.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
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
            <div className="flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ">
              <ModlBalance />
            </div>

            <div className="flex items-center bg-none dark:bg-none  border-gray-200 dark:border-gray-700">
              <TierBadge address={address!} />
            </div>

            <div className="flex items-center">
              <CreateProjectModal preselectedTemplateId={preselectedTemplateId} />
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <section className="space-y-6">
          {loadingProjects || loadingModules ? (
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={2}
              navigation
              grabCursor
              className="!overflow-visible"
            >
              {[...Array(3)].map((_, i) => (
                <SwiperSlide
                  key={i}
                  className="min-w-[260px] sm:min-w-[300px] flex flex-col rounded-2xl bg-gray-200 dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow p-5"
                >
                  <SkeletonBox className="h-6 w-1/2 mb-3" />
                  <SkeletonBox className="h-4 w-full mb-3" />
                  <SkeletonBox className="h-4 w-3/4" />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : enrichedProjects.length === 0 ? (
            <div className="text-center text-blue-700 dark:text-blue-400">
              No projects yet. Click <span className="font-semibold">"New Project"</span> to create one.
            </div>
          ) : (
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={2} // default minimum
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              navigation
              grabCursor
              className="w-full"
            >
              {enrichedProjects.map((project) => (
                <SwiperSlide
                  key={project.projectId.toString()}
                  className="min-w-[260px] sm:min-w-[300px]"
                >
                  <ProjectCard project={project} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* Audit Stats Section */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-400">
              Audit Stats
            </h2>
            <button
              onClick={handleRefreshStats}
              disabled={auditStatsLoading}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-400 transition font-medium disabled:opacity-50"
            >
              {auditStatsLoading ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['total', 'pending', 'verified', 'disputed'].map((key) => (
              <div
                key={key}
                className="p-5 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow text-center"
              >
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {auditStatsLoading ? '...' : auditStats?.[key] ?? 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Audited Templates Section */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-400">
            🏆 Top 5 Most Audited Templates
          </h2>
          {topAuditedTemplates.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No templates audited yet.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {topAuditedTemplates.map((template) => (
                <li
                  key={template.templateId}
                  className="p-4 rounded bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow"
                >
                  <div className="flex justify-between">
                    <span>
                      {template.name} (v{template.version})
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-300">
                      {template.auditCount} audits
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Deployments Section */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-400">
            🕒 Recent Deployments
          </h2>
          {loadingDeployments ? (
            <p className="text-gray-500 dark:text-gray-400">Loading recent deployments...</p>
          ) : (recentDeployments || []).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No recent deployments found.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentDeployments.map((deployment) => (
                <li
                  key={deployment.txHash || deployment.moduleAddress}
                  className="p-4 rounded bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow"
                >
                  <div className="flex justify-between items-center">
                    <a
                      href={`https://sepolia.basescan.org/tx/${deployment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-500 dark:text-blue-300 break-all"
                    >
                      🔗 {deployment.moduleAddress.slice(0, 10)}...
                    </a>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(deployment.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
