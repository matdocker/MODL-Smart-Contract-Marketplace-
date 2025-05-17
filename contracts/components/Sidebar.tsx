'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import GaslessToggleButton from '@/components/GaslessToggleButton.tsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: Layers },
  { name: 'Register', href: '/Register', icon: Layers },
  { name: 'Audits', href: '/Audits', icon: Layers },
  { name: 'Verify', href: '/Verify', icon: ShieldCheck },
  { name: 'Account', href: '/Account', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="flex-1 p-4 space-y-2">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-2 rounded-md transition ${
              pathname === href
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{name}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
        <GaslessToggleButton /> {/* ⬅ Inserted gasless toggle here */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="mb-2 sm:mb-0">
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              MODULR
            </span>
          </div>
          <div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
