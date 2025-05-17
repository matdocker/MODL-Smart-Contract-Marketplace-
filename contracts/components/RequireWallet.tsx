'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/'); // redirect to homepage or a custom login page
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null; // optional: you can show a spinner or placeholder here
  }

  return <>{children}</>;
}
