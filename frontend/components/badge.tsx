// components/Badge.tsx
type Props = {
    label: string;
    variant?: 'success' | 'warning' | 'error';
  };
  
  export default function Badge({ label, variant = 'success' }: Props) {
    const colors = {
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    };
  
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[variant]}`}>
        {label}
      </span>
    );
  }
  