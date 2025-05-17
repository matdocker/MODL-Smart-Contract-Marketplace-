const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const proxyAddress = process.env.DEPLOYMENT_MANAGER_PROXY;
  const relayHubAddress = process.env.RELAY_HUB_ADDRESS;

  if (!proxyAddress || !relayHubAddress) {
    throw new Error("❌ Missing DEPLOYMENT_MANAGER_PROXY or RELAY_HUB_ADDRESS in .env");
  }

  const deploymentManager = await ethers.getContractAt("DeploymentManager", proxyAddress);

  console.log("🔗 Setting RelayHub on DeploymentManager...");
  const tx = await deploymentManager.setRelayHub(relayHubAddress);
  await tx.wait();

  console.log(`✅ DeploymentManager relayHub set to: ${relayHubAddress}`);
}

main().catch((err) => {
  console.error("❌ Failed to set RelayHub:", err);
  process.exit(1);
});
