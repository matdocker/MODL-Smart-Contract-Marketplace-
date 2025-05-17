const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Interface } = require("ethers"); // ✅ valid in ethers v6+

const DEPLOYMENT_MANAGER_PROXY = "0xBC7e41034c028724de34C7AeE97De6758fae8761";
const TRUSTED_FORWARDER = "0x9D630077D10272936cB368D1eE370a3Ec2b20704";

const abiPath = path.join(__dirname, "../artifacts/contracts/DeploymentManager.sol/DeploymentManager.json");
let deploymentManagerABI;

try {
  const rawAbi = fs.readFileSync(abiPath, "utf8");
  deploymentManagerABI = JSON.parse(rawAbi).abi;
  console.log("📦 ABI loaded successfully from:", abiPath);

  const contains = deploymentManagerABI.some(entry => entry.name === "isTrustedForwarder");
  console.log("🔍 ABI contains isTrustedForwarder():", contains);
} catch (err) {
  console.error("❌ Failed to load ABI:", err);
  process.exit(1);
}

describe("DeploymentManager - Gasless MetaTx Debug", () => {
  let owner, user, deploymentManager;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    user = owner;

    console.log("👤 Owner address:", owner.address);
    console.log("👤 User address:", user.address);

    deploymentManager = new ethers.Contract(
      DEPLOYMENT_MANAGER_PROXY,
      deploymentManagerABI,
      owner
    );

    console.log("🔗 Attached to DeploymentManager at:", deploymentManager.target || deploymentManager.address);

    const isTrusted = await deploymentManager.isTrustedForwarder(TRUSTED_FORWARDER);
    console.log("✅ isTrustedForwarder() returned:", isTrusted);
  });

  it("should confirm trusted forwarder is correctly set", async () => {
    const result = await deploymentManager.isTrustedForwarder(TRUSTED_FORWARDER);
    console.log("🚀 Final call result:", result);
    expect(result).to.be.true;
  });

 it("should deleteProject via ERC-2771-style meta-tx", async function () {
    console.log("🔧 Running 'should deleteProject via ERC-2771-style meta-tx' test…");
    this.timeout(80_000);

    // ── 1. Grab existing projects ────────────────────────────────────────────
    const existing = await deploymentManager.getUserProjects(user.address);
    const ids      = existing.map(p => p.projectId.toString());

    if (ids.length === 0) {
      console.warn("⚠️  No projects to delete for this user — skipping test.");
      return this.skip();
    }

    const targetId = ids[ids.length - 1];          // choose the last/Highest ID
    console.log("🎯 Deleting existing projectId:", targetId);

    // ── 2. Encode deleteProject(uint256) with ERC-2771 suffix ────────────────
    const iface   = new Interface(["function deleteProject(uint256)"]);
    const call    = iface.encodeFunctionData("deleteProject", [targetId]);
    const suffix  = user.address.slice(2).padStart(64, "0");
    const data    = call + suffix;

    console.log("📨 Meta-tx calldata:", data);

    // ── 3. Send meta-tx from simulated trusted forwarder (owner) ─────────────
    try {
      const metaTx = await owner.sendTransaction({
        to: DEPLOYMENT_MANAGER_PROXY,
        data,
      });
      console.log("🚀 Meta-tx hash:", metaTx.hash);
      await metaTx.wait();
    } catch (err) {
      console.error("❌ Meta-tx reverted:", err);
      throw err;                                   // surface revert reason
    }

    // ── 4. Verify deletion ───────────────────────────────────────────────────
    const after  = (await deploymentManager.getUserProjects(user.address))
                  .map(p => p.projectId.toString());
    console.log("📋 IDs after delete:", after);

    expect(after).to.not.include(targetId);
  });


  it("should deleteProject via ERC-2771-style meta-tx", async function () {
    console.log("🔧 Running 'should deleteProject via ERC-2771-style meta-tx' test...");

    this.timeout(80000);
    console.log("👤 Acting user:", user.address);

    const tx1 = await deploymentManager.connect(user).createProject("Gasless Project");
    await tx1.wait();

    const projectsBefore = await deploymentManager.getUserProjects(user.address);
    expect(projectsBefore.length).to.be.greaterThan(0);

    const projectId = projectsBefore[projectsBefore.length - 1].projectId;
    console.log("🆔 Project ID:", projectId.toString());

    const iface = new Interface([
      "function deleteProject(uint256)"
    ]);
    const encoded = iface.encodeFunctionData("deleteProject", [projectId]);
    const appended = user.address.slice(2).padStart(64, "0");
    const fullCalldata = encoded + appended;
    console.log("📨 Full ERC-2771 calldata:", fullCalldata);

    // 🔁 Simulate trusted forwarder locally using any signer (e.g., owner)
    try {
      const tx2 = await owner.sendTransaction({
        to: DEPLOYMENT_MANAGER_PROXY,
        data: fullCalldata
      });
      console.log("🚀 Meta-tx sent:", tx2.hash);
      await tx2.wait();
    } catch (err) {
      console.error("❌ Meta-tx error:", err);
      throw err;
    }

    const remaining = await deploymentManager.getUserProjects(user.address);
    const projectIds = remaining.map(p => p.projectId.toString());
    console.log("📋 Remaining project IDs:", projectIds);

    expect(projectIds).to.not.include(projectId.toString());
  });

 it("should deploy template via ERC-2771-style meta-tx", async function () {
  this.timeout(80_000);

  // ── 1. Grab an existing project ID ───────────────────────────────────────
  const projects = await deploymentManager.getUserProjects(user.address);
  const ids      = projects.map(p => p.projectId.toString());

  if (ids.length === 0) {
    console.warn("⚠️  No existing projects — skipping template-deploy test.");
    return this.skip();
  }

  // Pick the last / highest ID (any one is fine)
  const projectId = ids[ids.length - 1];
  console.log("🆔 Using existing projectId for template deploy:", projectId);

  // ── (Optional) snapshot module count before ──────────────────────────────
  const beforeModules = await deploymentManager.getProjectModules(projectId);
  const beforeCount   = beforeModules.length;
  console.log("📋 Module count before:", beforeCount);

  // ── 2. Choose a templateId (replace with real one if needed) ─────────────
  const templateId = 1;

  // ── 3. Encode deployTemplateToProject(uint256,uint256) + ERC-2771 suffix ─
  const iface   = new Interface([
    "function deployTemplateToProject(uint256,uint256)"
  ]);
  const call    = iface.encodeFunctionData("deployTemplateToProject", [
    projectId,
    templateId,
  ]);
  const suffix  = user.address.slice(2).padStart(64, "0");
  const data    = call + suffix;

  console.log("📨 ERC-2771 calldata:", data);

  // ── 4. Simulate trusted forwarder meta-tx ────────────────────────────────
  try {
    const tx = await owner.sendTransaction({
      to: DEPLOYMENT_MANAGER_PROXY,
      data,
    });
    console.log("🚀 Meta-tx hash:", tx.hash);
    await tx.wait();
  } catch (err) {
    console.error("❌ Meta-tx failed:", err);
    throw err;
  }

  // ── 5. Verify module count increased (optional but useful) ───────────────
  const afterModules = await deploymentManager.getProjectModules(projectId);
  const afterCount   = afterModules.length;
  console.log("📋 Module count after :", afterCount);

  expect(afterCount).to.equal(beforeCount + 1);
  });

});
