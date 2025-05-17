const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.MODL_PAYMASTER_PROXY;
  const modlTokenAddress = process.env.MODL_TOKEN;
  const [signer] = await ethers.getSigners();

  const modlToken = await ethers.getContractAt("IERC20", modlTokenAddress);
  const ethBalance = await ethers.provider.getBalance(paymasterAddress);
  const modlBalance = await modlToken.balanceOf(paymasterAddress);

  console.log(`✅ Paymaster ETH balance: ${ethers.formatEther(ethBalance)} ETH`);
  console.log(`✅ Paymaster MODL balance: ${ethers.formatUnits(modlBalance, 18)} MODL`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
