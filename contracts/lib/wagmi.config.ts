// config/index.tsx

import { cookieStorage, createStorage, http } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum } from '@reown/appkit/networks';

// ✅ 1. Ensure `projectId` is present
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  throw new Error('❌ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing from environment variables.');
}

// ✅ 2. Define supported chains
export const networks = [mainnet, arbitrum];

// ✅ 3. Create a robust WagmiAdapter instance
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: typeof window === 'undefined', // safer than hardcoded `true`
  storage: createStorage({
    storage: cookieStorage,
  })
});

// ✅ 4. Export final Wagmi config
export const config = wagmiAdapter.wagmiConfig;
