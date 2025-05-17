import './globals.css';
import { Toaster } from 'react-hot-toast';
import TopNav from '@/components/TopNav';
import { ThemeProvider } from '@/theme/ThemeProvider';
import WagmiClientWrapper from '@/components/WagmiClientWrapper';
import "tailwindcss"
export const metadata = {
  title: 'MODULR',
  description:
    'Modulr is the gasless, modular smart contract builder for launching and scaling Web3 projects — no code required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          <WagmiClientWrapper>
            <TopNav />
            <Toaster position="top-center" />
            <main className="min-h-screen max-w-7xl mx-auto p-4">{children}</main>
          </WagmiClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
