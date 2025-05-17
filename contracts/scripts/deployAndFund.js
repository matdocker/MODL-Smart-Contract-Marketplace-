const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MODLToken
  const MODLToken = await ethers.getContractFactory("MODLToken");
  const modlToken = await MODLToken.deploy();
  await modlToken.waitForDeployment();
  console.log("✅ MODLToken deployed at:", modlToken.target);

  // 2. Deploy TierSystem
  const TierSystem = await ethers.getContractFactory("TierSystem");
  const tierSystem = await TierSystem.deploy();
  await tierSystem.waitForDeployment();
  console.log("✅ TierSystem deployed at:", tierSystem.target);

  // 3. Deploy FeeManager
  const FeeManager = await ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy();
  await feeManager.waitForDeployment();
  console.log("✅ FeeManager deployed at:", feeManager.target);

  // 4. Deploy TemplateRegistry
  const TemplateRegistry = await ethers.getContractFactory("TemplateRegistry");
  const templateRegistry = await TemplateRegistry.deploy();
  await templateRegistry.waitForDeployment();
  console.log("✅ TemplateRegistry deployed at:", templateRegistry.target);

  // 5. Deploy TemplateFactory
  const TemplateFactory = await ethers.getContractFactory("TemplateFactory");
  const templateFactory = await TemplateFactory.deploy();
  await templateFactory.waitForDeployment();
  console.log("✅ TemplateFactory deployed at:", templateFactory.target);

  // 6. Deploy Forwarder
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy();
  await forwarder.waitForDeployment();
  console.log("✅ Forwarder deployed at:", forwarder.target);

  // 7. Deploy RelayHub (needs deployer's address as initialOwner)
  const RelayHub = await ethers.getContractFactory("RelayHub");
  const relayHub = await RelayHub.deploy(deployer.address);
  await relayHub.waitForDeployment();
  console.log("✅ RelayHub deployed at:", relayHub.target);

  // 8. Deploy StakeManager
  const StakeManager = await ethers.getContractFactory("StakeManager");
  const stakeManager = await StakeManager.deploy();
  await stakeManager.waitForDeployment();
  console.log("✅ StakeManager deployed at:", stakeManager.target);

  // 9. Deploy Penalizer
  const Penalizer = await ethers.getContractFactory("Penalizer");
  const penalizer = await Penalizer.deploy();
  await penalizer.waitForDeployment();
  console.log("✅ Penalizer deployed at:", penalizer.target);

  // 10. Deploy MODLPaymaster (needs 4 addresses)
  const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");
  const modlPaymaster = await MODLPaymaster.deploy(
    forwarder.target,
    relayHub.target,
    modlToken.target,
    tierSystem.target
  );
  await modlPaymaster.waitForDeployment();
  console.log("✅ MODLPaymaster deployed at:", modlPaymaster.target);

  // --- SETUP ---

  // 11. Fund Paymaster with ETH for gasless transactions
  const fundTx = await deployer.sendTransaction({
    to: modlPaymaster.target,
    value: parseEther("0.5")
  });
  await fundTx.wait();
  console.log("✅ Funded Paymaster with 0.5 ETH");

  // 12. Mint MODL tokens to test user
  const testUser = deployer.address; // You can replace this with another wallet if you prefer
  await modlToken.mint(testUser, parseEther("1000"));
  console.log(`✅ Minted 1000 MODL tokens to ${testUser}`);

  // 13. Approve and deposit MODL tokens into Paymaster
  await modlToken.connect(deployer).approve(modlPaymaster.target, parseEther("1000"));
  await modlPaymaster.connect(deployer).depositFor(testUser, parseEther("1000"));
  console.log(`✅ Deposited 1000 MODL tokens for ${testUser} into Paymaster`);

  // 14. Set user to Tier 3 (for discounted testing)
  await tierSystem.connect(deployer).setTier(testUser, 3);
  console.log(`✅ Set Tier 3 for ${testUser}`);

  // --- SAVE Addresses ---

  const addresses = {
    MODLToken: modlToken.target,
    TierSystem: tierSystem.target,
    FeeManager: feeManager.target,
    TemplateRegistry: templateRegistry.target,
    TemplateFactory: templateFactory.target,
    MODLPaymaster: modlPaymaster.target,
    RelayHub: relayHub.target,
    Forwarder: forwarder.target,
    StakeManager: stakeManager.target,
    Penalizer: penalizer.target,
  };

  const envFile = Object.entries(addresses)
    .map(([key, value]) => `${key}Address=${value}`)
    .join("\n");

  fs.writeFileSync(".env.local", envFile);
  console.log("✅ Saved contract addresses to .env.local");

  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));
  console.log("✅ Saved contract addresses to addresses.json");

  console.log("\n🎉 ALL DONE! Ready for frontend testing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
