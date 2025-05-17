import { BrowserProvider } from 'ethers';
import { RelayProvider } from '@opengsn/provider';

export async function getGsnProvider(paymasterAddress: string) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected provider (window.ethereum) found.');
  }

  const gsnRelayProvider = await RelayProvider.newProvider({
    provider: window.ethereum,
    config: {
      paymasterAddress,
      loggerConfiguration: {
        logLevel: 'debug',
      },
    },
  }).init();

  // Cast as any to satisfy ethers v6 BrowserProvider type
  return new BrowserProvider(gsnRelayProvider as any);
}
