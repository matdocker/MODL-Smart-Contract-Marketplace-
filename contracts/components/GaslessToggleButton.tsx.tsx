'use client';

import { useGasless } from '@/components/GaslessProvider';
import { useTierSystem } from '@/hooks/useTierSystem';

export default function GaslessToggleButton() {
  const { gaslessEnabled, setGaslessEnabled, relayerOnline } = useGasless();
  const { tier, isLoading, error } = useTierSystem();

  if (isLoading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
        Loading tier info...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Failed to load tier info. Please reconnect wallet.
      </p>
    );
  }
  // Tier < 1
  // Disable gasless mode
  // and show message
  // "Gasless mode is available from Tier 1 and up."
  if (tier! < 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        🔒 Gasless mode is available from Tier 1 and up.
      </p>
    );
  }

  if (!relayerOnline) {
    return (
      <p className="text-sm text-yellow-500">
        ⚠️ Gasless relayer unavailable. Please try later.
      </p>
    );
  }

  return (
    <button
      onClick={() => setGaslessEnabled(!gaslessEnabled)}
      className={`px-4 py-2 rounded transition duration-300 ${
        gaslessEnabled
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {gaslessEnabled ? '✅ Gasless Mode ON' : '⚡ Enable Gasless Mode'}
    </button>
  );
}
