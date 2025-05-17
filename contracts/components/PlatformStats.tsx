// components/PlatformStats.tsx
'use client';
import { usePlatformStats } from '@/hooks/usePlatformStats';

export default function PlatformStats() {
  const { totalTemplates, totalVerified, totalStaked, activeUsers, loading } = usePlatformStats();

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-400">🌐 Platform Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <StatCard label="Templates" value={loading ? '...' : totalTemplates} />
        <StatCard label="Verified" value={loading ? '...' : totalVerified} />
        <StatCard label="MODL Staked" value={loading ? '...' : `${totalStaked} MODL`} />
        <StatCard label="Active Users" value={loading ? '...' : activeUsers} />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow">
      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
