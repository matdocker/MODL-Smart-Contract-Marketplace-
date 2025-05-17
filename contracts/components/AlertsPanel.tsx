// components/AlertsPanel.tsx
'use client';
import { useAlerts } from '@/hooks/useAlerts';

export default function AlertsPanel() {
  const { alerts, loading } = useAlerts();

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 shadow space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-yellow-700 dark:text-yellow-400">⚠️ System Alerts</h2>
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Checking alerts...</p>
      ) : alerts.length === 0 ? (
        <p className="text-center text-green-600 dark:text-green-400">✅ No alerts at the moment!</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert, i) => (
            <li key={i} className="p-4 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700">
              <p className="text-sm">{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
