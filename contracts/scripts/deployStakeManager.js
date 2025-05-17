// scripts/deployStakeManager.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🚀 Deploying StakeManager...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  const StakeManager = await ethers.getContractFactory("StakeManager");

  const maxUnstakeDelay = 604800; // e.g. 7 days in seconds
  const abandonmentDelay = 1209600; // e.g. 14 days
  const escheatmentDelay = 2592000; // e.g. 30 days
  const burnAddress = "0x000000000000000000000000000000000000dEaD"; // Burn address
  const devAddress = deployer.address; // You can set to deployer or another address
  const initialOwner = deployer.address;

  const stakeManager = await StakeManager.deploy(
    maxUnstakeDelay,
    abandonmentDelay,
    escheatmentDelay,
    burnAddress,
    devAddress,
    initialOwner
  );
  await stakeManager.waitForDeployment();

  console.log("✅ StakeManager deployed at:", await stakeManager.getAddress());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
