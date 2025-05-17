const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0xcDa0AE5d0a989EB42FC9f5e62017C62924197619"; // Your actual proxy

  const TemplateRegistry = await ethers.getContractFactory("TemplateRegistry");

  // First: force import to register the proxy as a UUPS proxy
  console.log("Force importing proxy...");
  await upgrades.forceImport(proxyAddress, TemplateRegistry, { kind: "uups" });

  // Then: upgrade
  console.log("Upgrading TemplateRegistry...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TemplateRegistry);
  await upgraded.waitForDeployment();

  console.log("✅ Upgrade successful at proxy:", await upgraded.getAddress());
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});
