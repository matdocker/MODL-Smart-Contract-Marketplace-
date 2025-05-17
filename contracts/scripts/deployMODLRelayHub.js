// scripts/deployRelayHub.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const trustedRelayer = "0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5"; // Replace with your real relayer

  const RelayHub = await ethers.getContractFactory("MODLRelayHub");
  const proxy = await upgrades.deployProxy(RelayHub, [trustedRelayer], {
    initializer: "initialize",
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ MODLRelayHub Proxy deployed at:", proxyAddress);
  console.log("🔧 Implementation address:", implAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
