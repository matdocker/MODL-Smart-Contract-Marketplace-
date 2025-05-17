const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const proxyAddress = process.env.RELAY_HUB_ADDRESS;

  if (!proxyAddress) {
    throw new Error("❌ Missing MODL_RELAY_HUB_PROXY in .env");
  }

  console.log("⏫ Upgrading MODLRelayHub at:", proxyAddress);

  const MODLRelayHub = await ethers.getContractFactory("MODLRelayHub");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MODLRelayHub);

  console.log("⛽ Waiting for deployment confirmation...");
  await upgraded.waitForDeployment();

  const newImplAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Upgrade complete");
  console.log("📍 Proxy address:", proxyAddress);
  console.log("📦 New implementation:", newImplAddress);
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exit(1);
});
