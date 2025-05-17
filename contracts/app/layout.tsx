import './globals.css';
import { AppProviders } from '../components/AppProviders';

export const metadata = {
  title: 'MODULR',
  description:
    'Modulr is the gasless, modular smart contract builder for launching and scaling Web3 projects — no code required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
