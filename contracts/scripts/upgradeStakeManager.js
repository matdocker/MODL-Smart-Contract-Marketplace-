const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "YOUR_PROXY_ADDRESS_HERE"; // ← replace with your proxy address

  const StakeManager = await ethers.getContractFactory("StakeManager");

  console.log("Force importing StakeManager proxy...");
  await upgrades.forceImport(proxyAddress, StakeManager, { kind: "uups" });

  console.log("Upgrading StakeManager...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, StakeManager);
  await upgraded.waitForDeployment();

  const newProxyAddress = await upgraded.getAddress();
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(newProxyAddress);

  console.log(`✅ Upgrade complete`);
  console.log(`✅ Proxy address           : ${newProxyAddress}`);
  console.log(`✅ New implementation address: ${newImplementationAddress}`);
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});
