const hre = require("hardhat");
const { ethers } = hre;

async function deployMockModlToken() {
  const MockModlToken = await ethers.getContractFactory("MockModlToken");
  console.log("📦 Deploying MockMODLToken...");
  const modlToken = await MockModlToken.deploy();
  await modlToken.waitForDeployment();
  return modlToken;
}

async function deployTestTierSystem(ownerAddress) {
  const TestTierSystem = await ethers.getContractFactory("TestTierSystem");
  console.log("📜 TestTierSystem ABI constructor inputs:", TestTierSystem.interface.deploy.inputs);
  const tierSystem = await TestTierSystem.deploy(ownerAddress);
  await tierSystem.waitForDeployment();
  return tierSystem;
}

async function deployModlPaymaster() {
  const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");
  console.log("📦 Deploying MODLPaymaster...");
  const paymaster = await MODLPaymaster.deploy();
  await paymaster.waitForDeployment();
  return paymaster;
}

module.exports = {
  deployMockModlToken,
  deployTestTierSystem,
  deployModlPaymaster
};
