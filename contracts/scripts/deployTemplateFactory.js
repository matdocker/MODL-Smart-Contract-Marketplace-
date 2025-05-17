// scripts/deployTemplateFactory.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with address:", deployer.address);

  const registryAddress = process.env.REGISTRY_ADDRESS;
  const trustedForwarder = process.env.TRUSTED_FORWARDER;

  if (!registryAddress || !hre.ethers.isAddress(registryAddress)) {
    throw new Error("❌ Invalid or missing REGISTRY_ADDRESS in .env");
  }

  if (!trustedForwarder || !hre.ethers.isAddress(trustedForwarder)) {
    throw new Error("❌ Invalid or missing TRUSTED_FORWARDER in .env");
  }

  console.log("🔗 Registry address:", registryAddress);
  console.log("🔗 Trusted forwarder:", trustedForwarder);

  const TemplateFactory = await hre.ethers.getContractFactory("TemplateFactory");
  const factory = await TemplateFactory.deploy(registryAddress, trustedForwarder);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ TemplateFactory deployed at:", factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
