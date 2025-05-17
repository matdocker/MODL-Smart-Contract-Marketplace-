import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Running role configuration with: ${deployer.address}`);

  // Replace these with the actual deployed addresses from 00_deployCore.ts output
  const addresses = {
    TierSystem: "0xTIER_SYSTEM",
    FeeManager: "0xFEE_MANAGER",
    TemplateRegistry: "0xTEMPLATE_REGISTRY",
    TemplateFactory: "0xTEMPLATE_FACTORY",
    DeploymentManager: "0xDEPLOYMENT_MANAGER",
    AuditRegistry: "0xAUDIT_REGISTRY",
    MODLPaymaster: "0xMODL_PAYMASTER",
  };

  const TierSystem = await ethers.getContractAt("TierSystem", addresses.TierSystem);
  const FeeManager = await ethers.getContractAt("FeeManager", addresses.FeeManager);
  const TemplateRegistry = await ethers.getContractAt("TemplateRegistry", addresses.TemplateRegistry);
  const TemplateFactory = await ethers.getContractAt("TemplateFactory", addresses.TemplateFactory);
  const DeploymentManager = await ethers.getContractAt("DeploymentManager", addresses.DeploymentManager);
  const AuditRegistry = await ethers.getContractAt("AuditRegistry", addresses.AuditRegistry);
  const MODLPaymaster = await ethers.getContractAt("MODLPaymaster", addresses.MODLPaymaster);

  // Roles
  const ADMIN_ROLE = await FeeManager.DEFAULT_ADMIN_ROLE();
  const UPGRADER_ROLE = await FeeManager.UPGRADER_ROLE();

  console.log("Granting inter-contract roles...");

  // Example: Allow DeploymentManager to update TemplateRegistry
  const TEMPLATE_MANAGER_ROLE = await TemplateRegistry.TEMPLATE_MANAGER_ROLE?.() || ethers.id("TEMPLATE_MANAGER_ROLE");
  await TemplateRegistry.grantRole(TEMPLATE_MANAGER_ROLE, DeploymentManager.address);

  // Example: Allow MODLPaymaster to read tiers
  const PAYMASTER_ROLE = await TierSystem.PAYMASTER_ROLE?.() || ethers.id("PAYMASTER_ROLE");
  await TierSystem.grantRole(PAYMASTER_ROLE, MODLPaymaster.address);

  // Optional: Give AuditRegistry permission to escalate disputes
  const AUDITOR_ROLE = await AuditRegistry.AUDITOR_ROLE?.() || ethers.id("AUDITOR_ROLE");
  await AuditRegistry.grantRole(AUDITOR_ROLE, deployer.address);

  // Secure Admin & Upgrade rights (replace with multisig/governance wallet)
  const GOVERNANCE_ADDR = "0xYOUR_GOVERNANCE_OR_SAFE";

  for (const contract of [FeeManager, TierSystem, AuditRegistry, TemplateRegistry, DeploymentManager, MODLPaymaster]) {
    await contract.grantRole(ADMIN_ROLE, GOVERNANCE_ADDR);
    await contract.grantRole(UPGRADER_ROLE, GOVERNANCE_ADDR);
    await contract.revokeRole(ADMIN_ROLE, deployer.address);
    await contract.revokeRole(UPGRADER_ROLE, deployer.address);
  }

  console.log("✅ Role configuration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
