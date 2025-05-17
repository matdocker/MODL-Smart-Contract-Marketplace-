const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying Penalizer with deployer:", deployer.address);

  const Penalizer = await ethers.getContractFactory("Penalizer");

  // ✅ Constructor args for Penalizer
  const penalizeBlockDelay = 5;       // blocks to wait after commit
  const penalizeBlockExpiration = 500; // blocks before commit expires

  const penalizer = await Penalizer.deploy(penalizeBlockDelay, penalizeBlockExpiration);
  await penalizer.waitForDeployment();

  console.log("✅ Penalizer deployed at:", await penalizer.getAddress());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
