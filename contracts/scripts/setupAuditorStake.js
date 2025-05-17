const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Using deployer/auditor (relayManager) address:", deployer.address);

  const modlTokenAddress = "0x06575CC82c1c86A5da41F14178777c97b7a005EF";
  const stakeManagerAddress = "0x584B5CD240583F90fcCF2d5F1d728d81fE71C69b";

  const MODLToken = await ethers.getContractAt("IERC20", modlTokenAddress);
  const StakeManager = await ethers.getContractAt("@opengsn/contracts/src/interfaces/IStakeManager", stakeManagerAddress);

  const stakeAmount = ethers.parseEther("1000");
  const unstakeDelay = 7 * 24 * 60 * 60; // 7 days, adjust if needed

  console.log(`\n💰 Checking deployer MODL balance...`);
  const deployerBalance = await MODLToken.balanceOf(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(deployerBalance)} MODL`);

  if (deployerBalance < stakeAmount) {
    throw new Error("❌ Not enough MODL in deployer account to stake.");
  }

  console.log(`\n🔑 Setting relayManager owner...`);
  const setOwnerTx = await StakeManager.connect(deployer).setRelayManagerOwner(deployer.address);
  await setOwnerTx.wait();
  console.log(`✅ Owner set for relayManager.`);

  console.log(`\n🔓 Approving StakeManager to spend deployer’s MODL...`);
  const approveTx = await MODLToken.connect(deployer).approve(stakeManagerAddress, stakeAmount);
  await approveTx.wait();
  console.log(`✅ Approval complete.`);

  console.log(`\n📥 Staking ${ethers.formatEther(stakeAmount)} MODL...`);
  const stakeTx = await StakeManager.connect(deployer).stakeForRelayManager(
    modlTokenAddress,
    deployer.address,
    unstakeDelay,
    stakeAmount
  );
  await stakeTx.wait();
  console.log(`✅ Staking complete.`);

  const { stakeInfo } = await StakeManager.getStakeInfo(deployer.address);
  console.log(`\n💡 Final stake for relayManager: ${ethers.formatEther(stakeInfo.stake)} MODL`);

  console.log(`\n✅ Setup script finished.`);
}

main().catch((error) => {
  console.error("❌ Setup script failed:", error);
  process.exitCode = 1;
});

