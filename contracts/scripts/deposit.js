const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const relayHubAddress = process.env.RELAY_HUB_ADDRESS;
  const paymaster = process.env.PAYMASTER_ADDRESS;

  const relayHubAbi = [
    "function depositForPaymaster(address paymaster) external payable",
    "function deposits(address paymaster) view returns (uint256)"
  ];

  const [deployer] = await ethers.getSigners();
  const relayHub = new ethers.Contract(relayHubAddress, relayHubAbi, deployer);

  const amount = ethers.parseEther("0.01");

  console.log(`Depositing 0.01 ETH for Paymaster: ${paymaster}...`);

  const tx = await relayHub.depositForPaymaster(paymaster, { value: amount });
  await tx.wait();

  const newBalance = await relayHub.deposits(paymaster);
  console.log("✅ New Paymaster deposit:", ethers.formatEther(newBalance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
