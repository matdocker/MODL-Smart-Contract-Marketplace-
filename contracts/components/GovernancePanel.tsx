// components/GovernancePanel.tsx
'use client';
import { useGovernance } from '@/hooks/useGovernance';

export default function GovernancePanel() {
  const { proposals, loading } = useGovernance();

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 shadow space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-purple-700 dark:text-purple-400">🗳️ Active Governance</h2>
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading proposals...</p>
      ) : proposals.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No active proposals right now.</p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((proposal) => (
            <li
              key={proposal.id}
              className="p-4 rounded bg-purple-50 dark:bg-purple-900 border border-purple-300 dark:border-purple-700"
            >
              <div className="flex justify-between">
                <span>{proposal.title}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{proposal.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
