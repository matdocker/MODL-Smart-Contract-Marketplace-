const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x6F0aA66D0B1847Ac6a569869Dc1e3382b3563746";

  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");

  console.log("⏫ Starting upgrade of AuditRegistry...");

  // Perform upgrade
  const upgraded = await upgrades.upgradeProxy(proxyAddress, AuditRegistry);
  await upgraded.waitForDeployment(); // Ethers v6 compatibility

  // Fetch new implementation address
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  // Fetch admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

  console.log("\n✅ Upgrade complete!");
  console.log("🔗 Proxy address (unchanged):", proxyAddress);
  console.log("🆕 New implementation address:", implAddress);
  console.log("🛡 Current proxy admin address:", adminAddress);

  console.log("\n📢 Debug summary:");
  console.log("  Proxy is now pointing to implementation:", implAddress);
  console.log("  Managed by admin:", adminAddress);
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});
