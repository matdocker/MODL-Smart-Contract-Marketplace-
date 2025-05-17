import RelayHubAbi from '@/abi/RelayHub.json'; // path to your ABI file
import { ethers } from 'ethers';

export function getRelayHubContract(relayHubAddress: string, provider: ethers.Provider) {
  return new ethers.Contract(relayHubAddress, RelayHubAbi, provider);
}
