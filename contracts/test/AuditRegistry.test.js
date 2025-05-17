const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// Use ethers.utils.id() to generate a sample templateId string
const sampleTemplateId = ethers.id("TEMPLATE-001");

describe("AuditRegistry (with OpenGSN)", function () {
    let AuditRegistry, auditRegistry;
    let owner, auditor, user, trustedForwarder;
    let AUDITOR_ROLE;
  
    beforeEach(async () => {
      [owner, auditor, user, trustedForwarder] = await ethers.getSigners();
      AuditRegistry = await ethers.getContractFactory("AuditRegistry");
      auditRegistry = await upgrades.deployProxy(AuditRegistry, [trustedForwarder.address], { initializer: "initialize" });
  
      // Retrieve the AUDITOR_ROLE directly in the beforeEach block so it's available in all tests.
      AUDITOR_ROLE = await auditRegistry.AUDITOR_ROLE();
      await auditRegistry.connect(owner).grantRole(AUDITOR_ROLE, auditor.address);
    });

  it("should allow an auditor to submit an audit", async () => {
    const tx = await auditRegistry.connect(auditor).submitAudit(
      sampleTemplateId,
      user.address, // template address being audited
      true,         // audit passed
      "ipfs://reportHash", // URI for audit report
      2             // auditor tier
    );

    await expect(tx)
      .to.emit(auditRegistry, 'AuditSubmitted')
      .withArgs(sampleTemplateId, auditor.address, true, "ipfs://reportHash", 2);

    const audits = await auditRegistry.getAudits(sampleTemplateId);
    expect(audits.length).to.equal(1);
    expect(audits[0].reportURI).to.equal("ipfs://reportHash");
  });

  it("should reject submission with an empty report URI", async () => {
    await expect(
      auditRegistry.connect(auditor).submitAudit(
        sampleTemplateId,
        user.address,
        true,
        "", // empty report URI
        1
      )
    ).to.be.revertedWith("Report URI required");
  });

  it("should reject audit submission by a non-auditor", async () => {
    await expect(
      auditRegistry.connect(user).submitAudit(
        sampleTemplateId,
        user.address,
        true,
        "ipfs://reportHash",
        1
      )
    ).to.be.reverted; // Catches any revert
  });

  it("should allow disputing an audit", async () => {
    // First, ensure an audit is submitted
    await auditRegistry.connect(auditor).submitAudit(
      sampleTemplateId,
      user.address,
      false,
      "ipfs://report1",
      1
    );

    const disputeTx = await auditRegistry
      .connect(user)
      .disputeAudit(sampleTemplateId, 0, "Disagree with findings");

    await expect(disputeTx)
      .to.emit(auditRegistry, 'AuditDisputed')
      .withArgs(sampleTemplateId, user.address, 0, "Disagree with findings");

    const audits = await auditRegistry.getAudits(sampleTemplateId);
    expect(audits[0].disputed).to.equal(true);
  });

  it("should reject dispute with empty reason", async () => {
    // Submit an audit to dispute
    await auditRegistry.connect(auditor).submitAudit(
      sampleTemplateId,
      user.address,
      true,
      "ipfs://audit",
      3
    );

    await expect(
      auditRegistry.connect(user).disputeAudit(sampleTemplateId, 0, "")
    ).to.be.revertedWith("Dispute reason required");
  });

  it("should reject disputing a non-existent audit", async () => {
    await expect(
      auditRegistry.connect(user).disputeAudit(sampleTemplateId, 0, "Missing")
    ).to.be.revertedWith("Audit does not exist");
  });

  
  it("should ensure only auditors can submit audits after role revocation", async () => {
    // Revoke the auditor role from the auditor account.
    await auditRegistry.connect(owner).revokeRole(AUDITOR_ROLE, auditor.address);

    // Expect that when the auditor (who no longer has the role) attempts to submit an audit,
    // it reverts with the custom error AccessControlUnauthorizedAccount.
    await expect(
      auditRegistry.connect(auditor).submitAudit(
        sampleTemplateId,
        user.address,
        true,
        "ipfs://newReport",
        1
      )
    ).to.be.revertedWithCustomError(auditRegistry, "AccessControlUnauthorizedAccount");
  });
});
