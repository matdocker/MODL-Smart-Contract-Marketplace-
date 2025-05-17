const { ethers } = require("hardhat");

async function main() {
  const [deployer, auditor, verifier] = await ethers.getSigners();

  const auditRegistryAddress = "0x6F0aA66D0B1847Ac6a569869Dc1e3382b3563746";
  const modlTokenAddress = "0x06575CC82c1c86A5da41F14178777c97b7a005EF";
  const stakeManagerAddress = "0x584B5CD240583F90fcCF2d5F1d728d81fE71C69b";

  const AuditRegistry = await ethers.getContractAt("AuditRegistry", auditRegistryAddress);
  const MODLToken = await ethers.getContractAt("IMODLToken", modlTokenAddress);
  const StakeManager = await ethers.getContractAt("IStakeManager", stakeManagerAddress);

  const templateId = ethers.keccak256(ethers.toUtf8Bytes("dummyTemplate"));
  const templateAddress = auditor.address; // placeholder
  const reportURI = "ipfs://dummyReport";
  const auditorTier = 3;

  const AUDITOR_ROLE = await AuditRegistry.AUDITOR_ROLE();
  const VERIFIER_ROLE = await AuditRegistry.VERIFIER_ROLE();

  console.log(`\n🔑 Granting roles...`);
  await AuditRegistry.connect(deployer).grantRole(AUDITOR_ROLE, auditor.address);
  await AuditRegistry.connect(deployer).grantRole(VERIFIER_ROLE, verifier.address);
  console.log(`✅ Roles granted.`);

  console.log(`\n💰 Checking initial balances...`);
  const balanceBefore = await MODLToken.balanceOf(auditor.address);
  const stakeBefore = await StakeManager.getStakeAmount(auditor.address);
  console.log(`Auditor MODL balance: ${ethers.formatEther(balanceBefore)} MODL`);
  console.log(`Auditor stake: ${ethers.formatEther(stakeBefore)} MODL`);

  console.log(`\n📤 Submitting audit for approval...`);
  await AuditRegistry.connect(auditor).submitAudit(templateId, templateAddress, reportURI, auditorTier);
  console.log("✅ Audit submitted.");

  console.log(`\n✅ Approving audit (rewarding)...`);
  await AuditRegistry.connect(verifier).verifyAudit(templateId, 0, true);
  const balanceAfterReward = await MODLToken.balanceOf(auditor.address);
  console.log(`Auditor MODL balance after reward: ${ethers.formatEther(balanceAfterReward)} MODL`);

  console.log(`\n📤 Submitting audit for rejection/slashing...`);
  await AuditRegistry.connect(auditor).submitAudit(templateId, templateAddress, reportURI, auditorTier);
  console.log("✅ Second audit submitted.");

  console.log(`\n❌ Rejecting audit (slashing)...`);
  await AuditRegistry.connect(verifier).verifyAudit(templateId, 1, false);
  const stakeAfterSlash = await StakeManager.getStakeAmount(auditor.address);
  console.log(`Auditor stake after slashing: ${ethers.formatEther(stakeAfterSlash)} MODL`);

  console.log(`\n✅ Test script finished.`);
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exitCode = 1;
});
