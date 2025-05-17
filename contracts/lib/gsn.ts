import { RelayProvider } from '@opengsn/provider';
import { ethers } from 'ethers';

export async function getRelayProvider() {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider (window.ethereum) found');
  }

  const originalProvider = new ethers.BrowserProvider(window.ethereum as any); // for ethers v6
    console.log('RelayHub →', process.env.NEXT_PUBLIC_GSN_RELAY_HUB);
    console.log('Paymaster →', process.env.NEXT_PUBLIC_GSN_PAYMASTER_ADDRESS);
    console.log('Forwarder →', process.env.NEXT_PUBLIC_GSN_FORWARDER);
  const gsnConfig = {
    paymasterAddress: process.env.NEXT_PUBLIC_GSN_PAYMASTER_ADDRESS || '',
    relayHubAddress: process.env.NEXT_PUBLIC_GSN_RELAY_HUB || '',
    forwarderAddress: process.env.NEXT_PUBLIC_GSN_FORWARDER || '',
    loggerConfiguration: { logLevel: 'error' as any },
  };
  

  const relayProvider = await RelayProvider.newProvider({
    provider: window.ethereum,
    config: gsnConfig,
  }).init();

  return new ethers.BrowserProvider(relayProvider as any); // wrapped for ethers v6 compatibility
}
