const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const paymasterAddress = process.env.MODL_PAYMASTER_PROXY;
  const paymaster = await ethers.getContractAt("MODLPaymaster", paymasterAddress);

  const trustedForwarder = await paymaster.getTrustedForwarder();
  console.log(`✅ Paymaster TrustedForwarder address: ${trustedForwarder}`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
