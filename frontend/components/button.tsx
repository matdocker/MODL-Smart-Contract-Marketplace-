// components/Button.tsx
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: Props) {
  const base = 'rounded-xl font-medium transition focus:outline-none';
  const variants = {
    primary: 'bg-primary text-white hover:bg-indigo-700',
    secondary: 'bg-secondary text-white hover:bg-cyan-700',
    tertiary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
