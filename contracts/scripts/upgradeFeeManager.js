const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const { FEE_MANAGER_PROXY } = process.env;

  if (!ethers.isAddress(FEE_MANAGER_PROXY)) {
    throw new Error("❌ Invalid FEE_MANAGER_PROXY address in .env");
  }

  console.log("⏳ Preparing FeeManager upgrade...");

  const FEE_MANAGER = await ethers.getContractFactory("FeeManager");

  const upgraded = await upgrades.upgradeProxy(FEE_MANAGER_PROXY, FEE_MANAGER, {
    kind: "uups",
  });

  await upgraded.waitForDeployment();

  const proxyAddress = await upgraded.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    upgraded.target
  );

  console.log("✅ FeeManager proxy (unchanged):", proxyAddress);
  console.log("✅ New implementation deployed at:", implAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
