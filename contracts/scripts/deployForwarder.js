// scripts/deployForwarder.js
const { ethers, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying with account:", deployer.address);

  const MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await MinimalForwarder.deploy(deployer.address); // Pass admin if AccessControl is present
  await forwarder.waitForDeployment();

  const forwarderAddress = await forwarder.getAddress();
  console.log("✅ Forwarder deployed to:", forwarderAddress);

  // Wait for Base Sepolia to index the deployment
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // 🔍 Verify the contract
  await run("verify:verify", {
    address: forwarderAddress,
    constructorArguments: [deployer.address],
  });

  console.log("🔎 Verified on block explorer");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
