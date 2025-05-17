// hooks/useGovernance.ts
'use client';
import { useEffect, useState } from 'react';

export function useGovernance() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      setLoading(true);
      try {
        // Mock data (replace with actual backend call later)
        const data = [
          { id: 1, title: 'Proposal #1: Adjust staking rewards', status: 'Active' },
          { id: 2, title: 'Proposal #2: Add new module type', status: 'Voting' },
        ];
        setProposals(data);
      } catch (err) {
        console.error('Failed to load governance proposals', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProposals();
  }, []);

  return { proposals, loading };
}
