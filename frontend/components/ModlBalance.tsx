import { useModlToken } from '../hooks/useModlToken';

export default function ModlBalance() {
  const { balance, loading } = useModlToken();

  const formattedBalance = loading ? '...' : Number(balance).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return <div className="text-sm text-gray-700">Balance: {formattedBalance} MODL</div>;
}
