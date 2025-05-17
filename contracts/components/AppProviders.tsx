// components/AppProviders.tsx
'use client';
import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Providers } from '@/components/Providers';
import { ModalProvider } from '@/context/ModalContext';
import ModalHost from '@/components/ModalHost';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { Toaster } from 'react-hot-toast';
import { GaslessProvider } from '@/components/GaslessProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Providers>
        <ModalProvider>
          <GaslessProvider>
            <div className="flex flex-col h-screen">
              <TopNav />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                  {children}
                </main>
              </div>
              <Toaster position="top-center" />
            </div>
            <ModalHost />
          </GaslessProvider>
        </ModalProvider>
      </Providers>
    </ThemeProvider>
  );
}
