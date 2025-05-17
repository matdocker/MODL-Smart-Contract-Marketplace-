const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.PAYMASTER_ADDRESS;
  const relayHubAddress = process.env.RELAY_HUB_ADDRESS;

  const abi = [
    "function setRelayHub(address) external",
    "function getRelayHub() view returns (address)"
  ];

  const [owner] = await ethers.getSigners();
  const paymaster = new ethers.Contract(paymasterAddress, abi, owner);

  console.log(`🔗 Setting RelayHub on MODLPaymaster...`);
  const tx = await paymaster.setRelayHub(relayHubAddress);
  await tx.wait();

  const confirmed = await paymaster.getRelayHub();
  console.log("✅ MODLPaymaster relayHub set to:", confirmed);
}

main().catch(console.error);
