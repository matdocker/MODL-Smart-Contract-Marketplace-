const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  const auditRegistryAddress = "0x6F0aA66D0B1847Ac6a569869Dc1e3382b3563746"; // replace with your deployed AuditRegistry address
  const templateRegistryAddress = "0xcDa0AE5d0a989EB42FC9f5e62017C62924197619"; // replace with your deployed TemplateRegistry address

  const AuditRegistry = await ethers.getContractAt("AuditRegistry", auditRegistryAddress);
  const TemplateRegistry = await ethers.getContractAt("TemplateRegistry", templateRegistryAddress);

  console.log("🔍 Checking linked TemplateRegistry address...");
  const linkedTemplateRegistry = await AuditRegistry.templateRegistry();
  console.log("✅ AuditRegistry → TemplateRegistry address:", linkedTemplateRegistry);

  console.log("🔍 Fetching TemplateRegistry template count...");
  const count = await TemplateRegistry.getTemplateCount();
  console.log("✅ Total registered templates:", count.toString());

  if (count === 0) {
    console.error("❌ No templates found. Please register a template first.");
    return;
  }

  const templateId = await TemplateRegistry.getTemplateIdByIndex(0);
  console.log("✅ First template ID:", templateId);

  // Grant AUDITOR_ROLE to signer
  console.log("🔑 Granting AUDITOR_ROLE to signer...");
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));
  await AuditRegistry.grantRole(AUDITOR_ROLE, signer.address);
  console.log("✅ AUDITOR_ROLE granted to signer:", signer.address);

  console.log("🔍 Submitting dummy audit...");
  const tx = await AuditRegistry.submitAudit(
    templateId,
    signer.address, // using signer as dummy template address
    "https://example.com/audit-report",
    1 // auditor tier
  );
  await tx.wait();

  console.log("✅ Dummy audit submitted!");
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exitCode = 1;
});
