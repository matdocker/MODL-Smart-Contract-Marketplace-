// components/Card.tsx
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export default function Card({ children, title, subtitle }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-darkSurface">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
