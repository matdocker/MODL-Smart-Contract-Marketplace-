const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  const signerAddress = await deployer.getAddress();

  // 🔥 Set your deployed MinimalForwarder address here
  const trustedForwarder = "0x9D630077D10272936cB368D1eE370a3Ec2b20704";

  const factory = await ethers.getContractFactory("MODLToken");
  const token = await factory.connect(deployer).deploy(signerAddress, trustedForwarder);
  await token.waitForDeployment();

  console.log("✅ MODLToken deployed at:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
