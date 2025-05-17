// scripts/setTrustedForwarder.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const forwarderAddress = process.env.FORWARDER_ADDRESS;

  if (!forwarderAddress) {
    throw new Error("❌ FORWARDER_ADDRESS is not set in .env");
  }

  const [deployer] = await ethers.getSigners();
  console.log("👷 Setting trusted forwarder as:", forwarderAddress);
  console.log("🔑 Using deployer:", deployer.address);

  // Update each contract
  const contracts = [
    { name: "MODLPaymaster", address: process.env.MODL_PAYMASTER_PROXY },
    { name: "DeploymentManager", address: process.env.DEPLOYMENT_MANAGER_PROXY },
    { name: "FeeManager", address: process.env.FEE_MANAGER_PROXY }, // Optional
  ];

  for (const { name, address } of contracts) {
    if (!address) {
      console.warn(`⚠️ ${name} address not set. Skipping...`);
      continue;
    }

    const contract = await ethers.getContractAt(name, address);
    const tx = await contract.setTrustedForwarder(forwarderAddress);
    console.log(`⏳ Updating ${name}...`);
    await tx.wait();
    console.log(`✅ ${name} updated: ${address}`);
  }

  console.log("🎉 All contracts updated with trusted forwarder!");
}

main().catch((err) => {
  console.error("❌ Error setting trusted forwarder:", err);
  process.exit(1);
});
