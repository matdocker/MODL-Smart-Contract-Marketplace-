const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying GSN Core Contracts...");
  console.log(`👤 Deployer address: ${deployer.address}\n`);

  // StakeManager (your local copy, no @opengsn path needed)
  const StakeManager = await ethers.getContractFactory("StakeManager");
  const stakeManager = await StakeManager.deploy();
  await stakeManager.waitForDeployment();
  console.log(`✅ StakeManager deployed at: ${await stakeManager.getAddress()}`);

  // Penalizer
  const Penalizer = await ethers.getContractFactory("Penalizer");
  const penalizer = await Penalizer.deploy();
  await penalizer.waitForDeployment();
  console.log(`✅ Penalizer deployed at: ${await penalizer.getAddress()}`);

  // Forwarder
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy();
  await forwarder.waitForDeployment();
  console.log(`✅ Forwarder deployed at: ${await forwarder.getAddress()}`);

  // RelayHub
  const RelayHub = await ethers.getContractFactory("RelayHub");
  const relayHub = await RelayHub.deploy(
    await stakeManager.getAddress(),
    await penalizer.getAddress()
  );
  await relayHub.waitForDeployment();
  console.log(`✅ RelayHub deployed at: ${await relayHub.getAddress()}`);

  console.log("\n🎉 All local GSN core contracts deployed successfully!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
