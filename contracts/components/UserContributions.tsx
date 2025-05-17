// components/UserContributions.tsx
'use client';
import { useUserContributions } from '@/hooks/useUserContributions';

export default function UserContributions() {
  const { templatesCreated, auditsPerformed, modlStaked, loading } = useUserContributions();

  const stats = [
    { label: 'Templates Created', value: templatesCreated },
    { label: 'Audits Performed', value: auditsPerformed },
    { label: 'MODL Staked', value: `${modlStaked} MODL` },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow text-center"
        >
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {loading ? '...' : stat.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
