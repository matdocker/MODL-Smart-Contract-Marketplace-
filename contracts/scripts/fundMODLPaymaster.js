const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🔍 Checking environment variables...");
  console.log("process.env.MODL_PAYMASTER_PROXY:", process.env.MODL_PAYMASTER_PROXY);
  console.log("process.env.FUND_AMOUNT:", process.env.FUND_AMOUNT);

  const paymasterAddress = process.env.MODL_PAYMASTER_PROXY;
  const fundAmount = process.env.FUND_AMOUNT || "0.01"; // default 0.01 ETH

  if (!paymasterAddress) {
    throw new Error("❌ Missing MODL_PAYMASTER_PROXY in .env");
  }

  console.log("🚀 Deployer address:", deployer.address);
  console.log("💸 Funding MODLPaymaster at:", paymasterAddress);
  console.log("💰 Amount (ETH):", fundAmount);

  const amountInWei = ethers.parseEther(fundAmount); // ✅ v6 uses ethers.parseEther

  const tx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: amountInWei,
  });

  console.log("⛽ Waiting for confirmation...");
  await tx.wait();

  console.log(`✅ Funded MODLPaymaster with ${fundAmount} ETH`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
