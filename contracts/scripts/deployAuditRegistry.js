// scripts/deployAuditRegistry.js
const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer address:", deployer.address);

  const trustedForwarder = process.env.TRUSTED_FORWARDER;
  const templateRegistry = process.env.TEMPLATE_REGISTRY;
  const modlToken = process.env.MODL_TOKEN;
  const stakeManager = process.env.STAKE_MANAGER;
  const rewardAmount = process.env.REWARD_AMOUNT || "1000000000000000000"; // e.g., 1 MODL
  const slashAmount = process.env.SLASH_AMOUNT || "500000000000000000";  // e.g., 0.5 MODL
  const slashBeneficiary = process.env.SLASH_BENEFICIARY;

  console.log("⚙ Config:");
  console.log("  TRUSTED_FORWARDER    =", trustedForwarder);
  console.log("  TEMPLATE_REGISTRY    =", templateRegistry);
  console.log("  MODL_TOKEN           =", modlToken);
  console.log("  STAKE_MANAGER        =", stakeManager);
  console.log("  REWARD_AMOUNT        =", rewardAmount);
  console.log("  SLASH_AMOUNT        =", slashAmount);
  console.log("  SLASH_BENEFICIARY    =", slashBeneficiary);

  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");

  console.log("📦 Deploying UUPS proxy...");
  const proxy = await upgrades.deployProxy(
    AuditRegistry,
    [
      trustedForwarder,
      templateRegistry,
      modlToken,
      stakeManager,
      rewardAmount,
      slashAmount,
      slashBeneficiary
    ],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"],
    }
  );

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxy.target);

  console.log("✅ Proxy deployed at:", proxyAddress);
  console.log("✅ Implementation at:", implAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
