'use client';
import { useWatchContractEvent } from 'wagmi';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects } from '@/hooks/useProjects';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import { useRecentDeployments } from '@/hooks/useRecentDeployments';
import { useModlToken } from '@/hooks/useModlToken';
import { useTierSystem } from '@/hooks/useTierSystem';
import { formatTimestamp } from '@/lib/formatTimestamp';
import toast from 'react-hot-toast';
import SkeletonBox from '@/components/SkeletonBox';
import ProjectSlider from '@/components/ProjectSlider';
import CreateProjectModal from '@/components/CreateProjectModal';
import { DEPLOYMENT_MANAGER_ADDRESS } from '@/constants/contracts';
import DeploymentManagerAbi from '@/abi/DeploymentManager.json';
import DashboardProjects from '@/components/DashboardProjects';

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();

  const { projects = [], loading: loadingProjects } = useProjects();
  const { templates = [] } = useTemplates();
  const { auditStats, auditStatsLoading, refetchAuditStats } = useAuditRegistry();
  const { recentDeployments = [], loading: loadingDeployments } = useRecentDeployments();
  const { balance, loading: loadingBalance } = useModlToken();
  const { tier, isLoading: loadingTier } = useTierSystem();

  useWatchContractEvent({
    address: DEPLOYMENT_MANAGER_ADDRESS,
    abi: DeploymentManagerAbi.abi,
    eventName: 'ProjectCreated',
    listener: () => {
      console.log('📡 ProjectCreated event detected → refreshing projects');
      queryClient.invalidateQueries(['projects', address]);
    },
  });
  useWatchContractEvent({
    address: DEPLOYMENT_MANAGER_ADDRESS,
    abi: DeploymentManagerAbi.abi,
    eventName: 'ProjectDeleted',
    listener: () => {
      console.log('📡 ProjectDeleted event detected → refreshing projects');
      queryClient.invalidateQueries(['projects', address]);
    },
  });

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-100">
        <div>Please connect your wallet to view your dashboard.</div>
      </main>
    );
  }

  const handleDelete = () => queryClient.invalidateQueries(['projects', address]);
  const handleCreate = () => queryClient.invalidateQueries(['projects', address]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 space-y-10 transition-colors duration-300">
      {/* HEADER */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">Welcome to Your MODULR Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage projects, monitor platform activity, and stay connected.
        </p>
      </section>

      {/* USER STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="MODL Balance" value={loadingBalance ? '...' : balance?.toLocaleString() ?? '0'} />
        <StatsCard label="Tier" value={loadingTier ? '...' : tier ? `Tier ${tier}` : '—'} />
        <StatsCard label="Your Contributions" value="— coming soon —" />
      </section>

      {/* PLATFORM STATS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total Templates" value={templates.length} />
        <StatsCard label="Verified Templates" value={templates.filter(t => t.verified).length} />
        <StatsCard label="MODL Staked" value="— coming soon —" />
        <StatsCard label="Active Users" value="— coming soon —" />
      </section>

      {/* PROJECTS */}
      <section className="space-y-4">
      <DashboardProjects />
      </section>


      {/* AUDIT STATS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Audit Stats</h2>
          <button
            onClick={handleRefreshStats}
            disabled={auditStatsLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {auditStatsLoading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['total', 'pending', 'verified', 'disputed'].map((key) => (
            <StatsCard
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={auditStatsLoading ? '...' : auditStats?.[key] ?? 0}
            />
          ))}
        </div>
      </section>

      {/* TOP AUDITED TEMPLATES */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Top Audited Templates</h2>
        {topAuditedTemplates.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No audit data available yet.</p>
        ) : (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {topAuditedTemplates.map((template) => (
              <li key={template.id}>
                {template.name} — {template.auditCount} audits
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* RECENT DEPLOYMENTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Deployments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingDeployments
            ? [...Array(3)].map((_, i) => (
                <SkeletonBox key={i} className="h-20 rounded-lg" />
              ))
            : (recentDeployments || []).map((deployment) => (
                <div
                  key={deployment.txHash || deployment.moduleAddress}
                  className="p-4 border rounded shadow hover:shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <a
                      href={`https://sepolia.basescan.org/tx/${deployment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      🔗 {deployment.moduleAddress.slice(0, 10)}...
                    </a>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(deployment.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* SYSTEM TRENDS + GOVERNANCE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">System Trends</h2>
        <p className="text-gray-500 dark:text-gray-400">Coming soon: charts and platform analytics.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Governance & Community</h2>
        <p className="text-gray-500 dark:text-gray-400">Coming soon: governance proposals and community updates.</p>
      </section>
    </main>
  );
}

function StatsCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded text-center shadow-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
