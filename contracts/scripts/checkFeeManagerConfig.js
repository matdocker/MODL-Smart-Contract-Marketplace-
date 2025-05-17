const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const feeManagerAddress = process.env.FEE_MANAGER_PROXY;
  const feeManager = await ethers.getContractAt("FeeManager", feeManagerAddress);

  const tierDiscounts = await feeManager.getTierDiscounts();
  console.log(`✅ FeeManager Tier Discounts: ${tierDiscounts.join(", ")}%`);

  const treasury = await feeManager.treasury();
  const founders = await feeManager.founders();
  const burnShare = await feeManager.burnShare();
  const treasuryShare = await feeManager.treasuryShare();
  const foundersShare = await feeManager.foundersShare();

  console.log(`✅ Treasury: ${treasury}`);
  console.log(`✅ Founders: ${founders}`);
  console.log(`✅ Burn Share: ${burnShare}%`);
  console.log(`✅ Treasury Share: ${treasuryShare}%`);
  console.log(`✅ Founders Share: ${foundersShare}%`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
