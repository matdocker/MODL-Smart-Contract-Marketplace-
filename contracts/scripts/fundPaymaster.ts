import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

const {
  PAYMASTER,
  RELAY_HUB,
  THRESHOLD = '0.02',
  TOPUP = '0.02',
} = process.env;

if (!PAYMASTER || !RELAY_HUB) {
  throw new Error('PAYMASTER and RELAY_HUB must be provided in .env');
}

const RELAY_HUB_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function depositFor(address) payable',
];

async function main() {
  console.log('🔧 Starting fundPaymaster script...');
  console.log(`🌍 PAYMASTER: ${PAYMASTER}`);
  console.log(`🌍 RELAY_HUB: ${RELAY_HUB}`);
  console.log(`🌍 Threshold: ${THRESHOLD} ETH, Top-up amount: ${TOPUP} ETH`);

  const provider = ethers.provider;
  console.log(`🔌 Connected network: ${(await provider.getNetwork()).name} (chainId: ${(await provider.getNetwork()).chainId})`);

  const [signer] = await ethers.getSigners();
  console.log(`👤 Signer address: ${await signer.getAddress()}`);
  console.log(`👛 Signer balance: ${ethers.formatEther(await provider.getBalance(signer))} ETH`);

  const hub = new ethers.Contract(RELAY_HUB, RELAY_HUB_ABI, signer);
  console.log('📡 Contract connected. Checking current balance...');

  let raw;
  try {
    raw = await hub.balanceOf(PAYMASTER);
  } catch (error) {
    console.error('❌ Failed to call balanceOf on RelayHub. Check ABI, address, or network.');
    throw error;
  }

  const deposit = Number(ethers.formatEther(raw));
  console.log(`💰 Current deposit in paymaster: ${deposit} ETH`);

  if (deposit >= Number(THRESHOLD)) {
    console.log(`✅ Above threshold (${THRESHOLD} ETH). No top-up needed.`);
    return;
  }

  console.log(`⚠️ Below threshold. Preparing to top up with ${TOPUP} ETH...`);

  let tx;
  try {
    tx = await hub.depositFor(PAYMASTER, {
      value: ethers.parseEther(TOPUP),
    });
    console.log(`⏳ Top-up transaction submitted. Tx hash: ${tx.hash}`);
    await tx.wait();
    console.log('🎉 Top-up confirmed on-chain.');
  } catch (error) {
    console.error('❌ Failed to send top-up transaction.');
    throw error;
  }

  try {
    const newBal = await hub.balanceOf(PAYMASTER);
    console.log(`✅ New deposit in paymaster: ${ethers.formatEther(newBal)} ETH`);
  } catch (error) {
    console.error('⚠️ Top-up succeeded but failed to read updated balance.');
    throw error;
  }
}

main().catch((err) => {
  console.error('❌ Script execution failed:', err);
  process.exit(1);
});
