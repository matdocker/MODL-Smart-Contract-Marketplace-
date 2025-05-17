const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  const trustedForwarder = process.env.TRUSTED_FORWARDER;
  const stakeManager = process.env.STAKE_MANAGER;

  console.log("🔍 Loaded from .env →");
  console.log("   TRUSTED_FORWARDER:", trustedForwarder);
  console.log("   STAKE_MANAGER    :", stakeManager);

  if (!trustedForwarder || !ethers.isAddress(trustedForwarder)) {
    throw new Error("❌ Invalid TRUSTED_FORWARDER address in .env");
  }
  if (!stakeManager || !ethers.isAddress(stakeManager)) {
    throw new Error("❌ Invalid STAKE_MANAGER address in .env");
  }

  const TemplateRegistry = await ethers.getContractFactory("TemplateRegistry");
  console.log("✅ Contract factory loaded: TemplateRegistry");

  console.log("📦 Initializer arguments →", [trustedForwarder, stakeManager]);

  console.log("🚀 Deploying TemplateRegistry proxy…");
  let templateRegistry;
  try {
    templateRegistry = await upgrades.deployProxy(
      TemplateRegistry,
      [trustedForwarder, stakeManager],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
  } catch (err) {
    console.error("❌ Error during deployProxy:", err);
    throw err; // Rethrow to go to main().catch()
  }

  console.log("⏳ Waiting for deployment...");
  await templateRegistry.waitForDeployment();

  const proxyAddress = templateRegistry.target;
  console.log(`✅ Proxy deployed at: ${proxyAddress}`);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log(`✅ Implementation deployed at: ${implementationAddress}`);

  console.log("🎉 Deployment completed successfully!");
}

main().catch((error) => {
  console.error("❌ Script failed with error:", error);
  process.exit(1);
});
