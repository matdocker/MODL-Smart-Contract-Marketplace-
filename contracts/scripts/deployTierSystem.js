// scripts/deployTierSystem.js
// npx hardhat run scripts/deployTierSystem.js --network base

require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // read env
  const tokenAddr = process.env.MODL_TOKEN;
  const forwarder = process.env.TRUSTED_FORWARDER;
  if (!ethers.isAddress(tokenAddr) || !ethers.isAddress(forwarder)) {
    throw new Error("Invalid MODL_TOKEN or TRUSTED_FORWARDER address");
  }

  console.log("Deploying TierSystem proxy…");
  const TierSystem = await ethers.getContractFactory("TierSystem");
  const tierProxy  = await upgrades.deployProxy(
    TierSystem,
    [tokenAddr, forwarder],
    { initializer: "initialize", kind: "uups" }
  );

  // v6: wait until code is mined
  await tierProxy.waitForDeployment();

  // v6: getAddress() instead of .address
  const proxyAddr = await tierProxy.getAddress();
  const implAddr  = await upgrades.erc1967.getImplementationAddress(proxyAddr);

  console.log("\n✅  Proxy deployed at :", proxyAddr);
  console.log("✅  Implementation @  :", implAddr);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
