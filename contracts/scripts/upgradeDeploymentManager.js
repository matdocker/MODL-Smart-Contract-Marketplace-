const { ethers, upgrades } = require("hardhat");

async function main() {
  const DeploymentManager = await ethers.getContractFactory("DeploymentManager");
  const proxyAddress = "0xBC7e41034c028724de34C7AeE97De6758fae8761";

  console.log("⏫ Upgrading DeploymentManager...");

  const upgraded = await upgrades.upgradeProxy(proxyAddress, DeploymentManager);
  await upgraded.waitForDeployment(); // ✅ Ethers v6 uses waitForDeployment

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Upgrade complete!");
  console.log("🔗 Proxy address:", proxyAddress);
  console.log("🆕 New implementation address:", implAddress);
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});
