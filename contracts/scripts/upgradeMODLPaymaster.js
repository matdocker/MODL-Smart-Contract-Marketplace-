const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const proxyAddress = process.env.MODL_PAYMASTER_PROXY;

  if (!proxyAddress) {
    throw new Error("❌ MODL_PAYMASTER_PROXY not set in .env");
  }

  console.log("⏫ Starting upgrade of MODLPaymaster at:", proxyAddress);

  const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MODLPaymaster);

  console.log("⛽ Waiting for upgrade tx to confirm...");
  await upgraded.waitForDeployment();

  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("✅ Upgrade successful!");
  console.log("📍 Proxy Address:", await upgraded.getAddress());
  console.log("🔧 Implementation Address:", newImpl);
}

main().catch((err) => {
  console.error("❌ Upgrade failed:", err);
  process.exit(1);
});
