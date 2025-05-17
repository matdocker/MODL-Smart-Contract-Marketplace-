import { useModlToken } from '../hooks/useModlToken';

export default function ModlBalance() {
  const { balance, loading } = useModlToken();

  const safeBalance = balance !== undefined && balance !== null ? Number(balance) : 0;
  const formattedBalance = safeBalance.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="text-m font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
      <span className="hidden sm:inline">MODL:</span>
      {loading ? 'Fetching...' : `${formattedBalance}`}
    </div>

  );
}
