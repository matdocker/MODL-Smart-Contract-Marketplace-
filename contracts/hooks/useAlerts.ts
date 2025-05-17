// hooks/useAlerts.ts
'use client';
import { useEffect, useState } from 'react';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      try {
        // Mock data (replace with actual backend call later)
        const data = [
          { message: '3 pending audits awaiting approval.' },
          { message: 'New template submissions require verification.' },
        ];
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  return { alerts, loading };
}
