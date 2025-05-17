const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x14cA535840aD9e135780Da3a3bdaCDFE8Bf64BBa";
  const TierSystem = await ethers.getContractFactory("TierSystem");

  console.log(`🔧 Force importing TierSystem proxy at: ${proxyAddress}`);
  await upgrades.forceImport(proxyAddress, TierSystem);
  console.log("✅ Proxy force-imported and registered");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
