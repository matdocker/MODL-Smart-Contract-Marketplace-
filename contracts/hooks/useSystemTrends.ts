// hooks/useSystemTrends.ts
'use client';
import { useEffect, useState } from 'react';

export function useSystemTrends() {
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        // Mock data (replace with actual fetch call later)
        const data = [
          { date: '2025-04-01', deployments: 5, audits: 2, registrations: 1 },
          { date: '2025-04-02', deployments: 8, audits: 4, registrations: 3 },
          { date: '2025-04-03', deployments: 12, audits: 6, registrations: 4 },
          { date: '2025-04-04', deployments: 7, audits: 3, registrations: 2 },
        ];
        setTrendsData(data);
      } catch (err) {
        console.error('Failed to load system trends', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, []);

  return { trendsData, loading };
}
