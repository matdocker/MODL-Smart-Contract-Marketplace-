const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MinimalForwarder with account:", await deployer.getAddress());

  const factory = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await factory.connect(deployer).deploy();
  await forwarder.waitForDeployment();

  console.log("✅ MinimalForwarder deployed at:", await forwarder.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
