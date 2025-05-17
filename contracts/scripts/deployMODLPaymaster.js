const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer address:", deployer.address);

  const owner = process.env.FOUNDERS;
  const trustedForwarder = process.env.TRUSTED_FORWARDER;

  console.log("⚙ Config:");
  console.log("  OWNER              =", owner);
  console.log("  TRUSTED_FORWARDER =", trustedForwarder);

  const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");

  console.log("📦 Deploying UUPS proxy...");
  const paymaster = await upgrades.deployProxy(
    MODLPaymaster,
    [owner, trustedForwarder],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await paymaster.waitForDeployment();

  const proxyAddress = await paymaster.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Proxy deployed at:", proxyAddress);
  console.log("✅ Implementation at:", implementationAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
