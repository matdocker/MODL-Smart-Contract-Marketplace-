const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const FEE_MANAGER = await ethers.getContractFactory("FeeManager");

  const {
    TREASURY,
    FOUNDERS,
    MODL_TOKEN,
    TIER_SYSTEM,
    GAS_TO_MODL_RATE,
    TRUSTED_FORWARDER,
  } = process.env;

  if (![TREASURY, FOUNDERS, MODL_TOKEN, TIER_SYSTEM, TRUSTED_FORWARDER].every(ethers.isAddress)) {
    throw new Error("❌ Invalid address in .env");
  }

  if (!GAS_TO_MODL_RATE || isNaN(GAS_TO_MODL_RATE)) {
    throw new Error("❌ Invalid GAS_TO_MODL_RATE in .env");
  }

  console.log("Deploying FeeManager proxy…");

  const feeManager = await upgrades.deployProxy(
    FEE_MANAGER,
    [
      TREASURY,
      FOUNDERS,
      MODL_TOKEN,
      TIER_SYSTEM,
      20, // burnShare (%)
      40, // treasuryShare (%)
      40, // foundersShare (%)
      GAS_TO_MODL_RATE, // ← added missing gasToModlRate param
      TRUSTED_FORWARDER,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await feeManager.waitForDeployment();

  const proxyAddress = await feeManager.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    feeManager.target
  );

  console.log("✅ Proxy deployed at           :", proxyAddress);
  console.log("✅ Implementation deployed at :", implAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
