const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("📦 Deploying DeploymentManager with account:", deployer.address);

  const templateFactory = process.env.TEMPLATE_FACTORY;
  const tierSystem = process.env.TIER_SYSTEM;
  const feeManager = process.env.FEE_MANAGER;
  const trustedForwarder = process.env.TRUSTED_FORWARDER;

  console.log("🧩 Configuration:");
  console.log("  TEMPLATE_FACTORY   =", templateFactory);
  console.log("  TIER_SYSTEM        =", tierSystem);
  console.log("  FEE_MANAGER        =", feeManager);
  console.log("  TRUSTED_FORWARDER  =", trustedForwarder);

  const DeploymentManager = await hre.ethers.getContractFactory("DeploymentManager");
  console.log("🚀 Deploying UUPS proxy...");
  const manager = await hre.upgrades.deployProxy(
    DeploymentManager,
    [templateFactory, tierSystem, feeManager, trustedForwarder],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"], // ← important fix
    }
  );

  await manager.waitForDeployment();

  const proxyAddress = await manager.getAddress();
  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Proxy deployed at           :", proxyAddress);
  console.log("✅ Implementation deployed at :", implementationAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
