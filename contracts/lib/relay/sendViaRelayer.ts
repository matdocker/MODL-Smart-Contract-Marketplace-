'use client';

import { toast } from 'react-hot-toast';

export async function sendViaRelayer(encodedData: string, address: string): Promise<string> {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL!;
  const paymaster = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS!;
  const target = process.env.NEXT_PUBLIC_DEPLOYMENT_MANAGER_ADDRESS!;
  const gasLimit = 200_000;

  if (!relayerUrl || !paymaster || !target) {
    console.error('❌ Missing environment variables:', { relayerUrl, paymaster, target });
    throw new Error('Relayer configuration is missing.');
  }

  if (!encodedData || !encodedData.startsWith('0x')) {
    console.error('[❌ Relayer] Invalid encoded data:', encodedData);
    throw new Error('Encoded function data is missing or malformed.');
  }

  if (!address || !address.startsWith('0x')) {
    console.error('[❌ Relayer] Invalid user address:', address);
    throw new Error('User address is missing or malformed.');
  }

  const payload = {
    paymaster,
    target,
    encodedData,
    gasLimit,
    user: address,
  };

  console.log('[🚀 DEBUG] Sending to relayer:', relayerUrl);
  console.log('[📦 DEBUG] Payload:', payload);

  toast.loading('Relaying transaction...', { id: 'relay' });

  let res: Response;
  try {
    res = await fetch(`${relayerUrl}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    toast.error('❌ Network error while contacting relayer', { id: 'relay' });
    console.error('❌ Network error while contacting relayer:', err);
    throw new Error('Failed to reach the relayer server.');
  }

  const status = res.status;
  const headers = Object.fromEntries(res.headers.entries());
  console.log('[🌐 DEBUG] Relayer response status:', status);
  console.log('[🌐 DEBUG] Relayer response headers:', headers);

  let result: any;
  let rawText: string;

  try {
    rawText = await res.text();
    result = JSON.parse(rawText);
  } catch (err) {
    toast.error('❌ Invalid response from relayer', { id: 'relay' });
    console.error('❌ Failed to parse JSON from relayer response:', err);
    console.error('🔍 Raw response text:', rawText);
    throw new Error('Invalid response from relayer. Not valid JSON.');
  }

  console.log('[✅ DEBUG] Relayer parsed response:', result);

  if (!res.ok || !result.txHash?.startsWith('0x')) {
    const reason = result.error || `Unexpected response: ${rawText || JSON.stringify(result)}`;
    toast.error(`❌ Relayer error: ${reason}`, { id: 'relay' });
    console.error('❌ Relayer returned error:', reason);
    throw new Error(reason);
  }

  const explorerUrl =
    process.env.NEXT_PUBLIC_ENV === 'mainnet'
      ? `https://basescan.org/tx/${result.txHash}`
      : `https://sepolia.basescan.org/tx/${result.txHash}`;

  toast.success(`✅ Transaction relayed!\n${explorerUrl}`, { id: 'relay' });

  return result.txHash;
}
