'use client';

import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { Toaster } from 'react-hot-toast';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const pathname = usePathname();

  const shouldShowSidebar =
    isConnected && (pathname.startsWith('/dashboard') || pathname !== '/');

  return (
    <div className="h-screen w-full flex flex-col">
      <TopNav />
      <Toaster position="top-center" />

      <div className={`flex flex-1 ${shouldShowSidebar ? '' : 'items-center justify-center'}`}>
        <AnimatePresence>
          {shouldShowSidebar && (
            <motion.aside
              key="sidebar"
              initial={{ x: -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -250, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-64 bg-gray-100 dark:bg-gray-800 border-r shadow-sm"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}


