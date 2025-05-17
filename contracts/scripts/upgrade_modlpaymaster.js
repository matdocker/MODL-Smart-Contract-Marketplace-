// scripts/upgrade_modlpaymaster.js

const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x5AE73F2411023EB21FDbcec19c30EB86EDd6AbD0"; // your deployed MODLPaymaster proxy

  console.log("🚀 Upgrading MODLPaymaster...");

  const MODLPaymasterNew = await ethers.getContractFactory("MODLPaymaster");
  await upgrades.upgradeProxy(proxyAddress, MODLPaymasterNew);

  console.log("✅ Upgrade completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
