'use client';

import { useTierSystem } from '../hooks/useTierSystem';

const tierColors = {
  1: 'bg-gray-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-purple-500',
};

const tierLabels = {
  1: 'Tier 1: Explorer',
  2: 'Tier 2: Builder',
  3: 'Tier 3: Architect',
  4: 'Tier 4: Visionary',
};

export default function TierBadge() {
  const { tier, isLoading } = useTierSystem();

  const color = tierColors[tier as keyof typeof tierColors] || 'bg-gray-700';
  const label = tierLabels[tier as keyof typeof tierLabels] || 'Unknown Tier';

  return (
    <div className={`text-xs font-semibold px-2 py-1 rounded ${tierColors[tier] || 'bg-gray-400'}`}>
      {tierLabels[tier] || `Tier ${tier ?? 0}`}
    </div>
  );
}
