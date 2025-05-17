// scripts/deployModlForwarder.js

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`🚀 Deploying contract with account: ${deployer.address}`);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

  const ModlForwarder = await ethers.getContractFactory("ModlForwarder");
  const modlForwarder = await ModlForwarder.deploy();

  console.log("⏳ Waiting for deployment confirmation...");
  await modlForwarder.deploymentTransaction().wait();

  console.log(`✅ ModlForwarder deployed to: ${modlForwarder.target}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
