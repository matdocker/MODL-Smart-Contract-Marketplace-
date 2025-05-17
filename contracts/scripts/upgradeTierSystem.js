const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x9D4240945cCfe0E3D263731F7c514daFA1BAfA2D";
  const TierSystem = await ethers.getContractFactory("TierSystem");

  console.log(`🔧 Upgrading TierSystem proxy at: ${proxyAddress}`);
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TierSystem);
  console.log("✅ TierSystem upgrade complete");

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`💥 New implementation address → ${implementationAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
