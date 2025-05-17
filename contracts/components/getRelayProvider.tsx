import { RelayProvider } from '@opengsn/provider';
import { Web3Provider } from '@ethersproject/providers';

type Eip1193Provider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

export async function getRelayProvider() {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider (window.ethereum) found');
  }

  const gsnConfig = {
    paymasterAddress: process.env.NEXT_PUBLIC_GSN_PAYMASTER_ADDRESS || '',
    relayHubAddress: process.env.NEXT_PUBLIC_GSN_RELAY_HUB || '',        // ✅ optionally include
    forwarderAddress: process.env.NEXT_PUBLIC_GSN_FORWARDER || '',       // ✅ optionally include
    loggerConfiguration: { logLevel: 'error' as 'error' | 'warn' | 'info' | 'debug' },
  };

  // ✅ Debug log to inspect config in the console
  console.log('GSN config →', gsnConfig);

  const originalProvider = window.ethereum;

  const relayProvider = await RelayProvider.newProvider({
    provider: originalProvider,
    config: gsnConfig,
  }).init();

  const wrappedProvider = wrapRelayProviderWithRequest(relayProvider);

  // ✅ ethers v5 Web3Provider (for ethers.js contracts)
  return new Web3Provider(wrappedProvider);
}

/**
 * Shim RelayProvider to add `.request()` method for Ethers v5 compatibility.
 */
function wrapRelayProviderWithRequest(relayProvider: any): Eip1193Provider {
  if (typeof relayProvider.request === 'function') {
    return relayProvider; // already compliant
  }

  relayProvider.request = async ({ method, params }) => {
    return new Promise((resolve, reject) => {
      relayProvider.send(
        { jsonrpc: '2.0', id: Date.now(), method, params },
        (err: any, res: any) => {
          if (err) {
            console.error('RelayProvider send error →', err);
            reject(err);
          } else {
            resolve(res.result);
          }
        }
      );
    });
  };

  return relayProvider;
}
