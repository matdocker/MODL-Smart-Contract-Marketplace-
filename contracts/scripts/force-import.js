const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x8E0C28657FF05876A04e52DFe885C07Fbb3e3EB3"; // ✅ This is your proxy
  const DeploymentManager = await ethers.getContractFactory("DeploymentManager");

  console.log("Registering proxy via forceImport...");
  await upgrades.forceImport(proxyAddress, DeploymentManager, { kind: "uups" });
  console.log("✅ Proxy registered. Ready for upgrade.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
