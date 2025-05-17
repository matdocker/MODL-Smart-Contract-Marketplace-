import { useEffect, useState } from 'react';

export type Deployment = {
  moduleAddress: string;
  txHash: string;
  timestamp: number;
};

export function useRecentDeployments() {
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        // You can replace this with on-chain event logs or backend API call
        const mockData: Deployment[] = [
          {
            moduleAddress: '0xA1b2C3d4E5f6G7h8I9j0',
            txHash: '0xabc123...',
            timestamp: Math.floor(Date.now() / 1000) - 60 * 5,
          },
          {
            moduleAddress: '0xF0e1D2c3B4a596877665',
            txHash: '0xdef456...',
            timestamp: Math.floor(Date.now() / 1000) - 60 * 60,
          },
        ];
        setRecentDeployments(mockData);
      } catch (err) {
        console.error('❌ Failed to fetch recent deployments:', err);
        setRecentDeployments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  return { recentDeployments, loading };
}
