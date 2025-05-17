const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TemplateRegistry (UUPS + GSN)", function () {
  let registry;
  let admin, user, forwarder, other;

  // keccak256("DEFAULT_ADMIN_ROLE")
  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  // keccak256("UPGRADER_ROLE")
  const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));

  beforeEach(async function () {
    // Get signers. We'll explicitly treat the first as `admin`.
    const signers = await ethers.getSigners();
    [admin, user, forwarder, other] = signers;
    // Print them out
    console.log("Test says 'admin' is:", await admin.getAddress());
    console.log("signers[0] is:", await (await ethers.getSigners())[0].getAddress());
    // They should match

    // Then connect to admin
    const TemplateRegistry = await ethers.getContractFactory("TemplateRegistry", admin);
    registry = await upgrades.deployProxy(
    TemplateRegistry,
    [await forwarder.getAddress()],
    { initializer: "initialize" }
    );  

    // Connect the contract factory to `admin`.
    // This ensures that inside `initialize()`, _msgSender() will be `admin`.
    // const TemplateRegistry = await ethers.getContractFactory("TemplateRegistry", admin);

    // // Deploy the proxy using `admin` as the deployer
    // registry = await upgrades.deployProxy(
    //   TemplateRegistry,
    //   [
    //     await forwarder.getAddress() // pass the GSN forwarder
    //   ],
    //   { initializer: "initialize" }
    // );
    await registry.waitForDeployment();

    const registryAddress = await registry.getAddress();
    console.log("TemplateRegistry proxy deployed at:", registryAddress);
  });

  it("Should grant roles to the deployer (admin) upon initialization", async () => {
    // Because we connected the contract factory to `admin`, `_msgSender()` 
    // during `initialize()` is indeed `admin`.

    // Check that admin has both roles
    const isAdminDefault = await registry.hasRole(DEFAULT_ADMIN_ROLE, await admin.getAddress());
    const isAdminUpgrader = await registry.hasRole(UPGRADER_ROLE, await admin.getAddress());
    console.log("isAdminDefault?", isAdminDefault, "isAdminUpgrader?", isAdminUpgrader);

    expect(isAdminDefault).to.equal(true);
    expect(isAdminUpgrader).to.equal(true);

    // Check user does not have these roles
    const isUserDefault = await registry.hasRole(DEFAULT_ADMIN_ROLE, await user.getAddress());
    const isUserUpgrader = await registry.hasRole(UPGRADER_ROLE, await user.getAddress());
    expect(isUserDefault).to.equal(false);
    expect(isUserUpgrader).to.equal(false);
  });

  it("Should allow registering a new template", async () => {
    // We'll register a template
    const implementation = await user.getAddress();
    const name = "MyDappTemplate";
    const version = "1.0.0";
    const templateType = 2;

    const tx = await registry.registerTemplate(implementation, name, version, templateType);
    const receipt = await tx.wait();

    // Find the TemplateRegistered event
    const event = receipt.logs?.find(
      (log) => log.fragment && log.fragment.name === "TemplateRegistered"
    );
    expect(event, "TemplateRegistered event not found").to.not.be.undefined;

    // Extract the templateId
    const templateId = event.args.templateId;
    console.log("Registered template with ID:", templateId);

    // Retrieve the template
    const templateData = await registry.getTemplate(templateId);
    expect(templateData.implementation).to.equal(implementation);
    expect(templateData.name).to.equal(name);
    expect(templateData.version).to.equal(version);
    expect(templateData.author).to.equal(await admin.getAddress());
    expect(templateData.verified).to.equal(false);
    expect(templateData.templateType).to.equal(templateType);
    expect(templateData.auditHash).to.equal("");
  });

  it("Should let only DEFAULT_ADMIN_ROLE verify, deprecate, or update templates", async () => {
    // Register a template
    const impl = await user.getAddress();
    const name = "SampleTemplate";
    const version = "2.1";
    const ttype = 1;

    const txReg = await registry.registerTemplate(impl, name, version, ttype);
    const receiptReg = await txReg.wait();
    const eventReg = receiptReg.logs?.find((log) => log.fragment?.name === "TemplateRegistered");
    const templateId = eventReg.args.templateId;

    // Attempt verify from a non-admin => revert
    // We'll do partial revert match because the actual revert might be a custom error
    await expect(
      registry.connect(user).verifyTemplate(templateId)
    ).to.be.reverted; // or .revertedWith(/AccessControl/)

    // Admin can verify
    await registry.verifyTemplate(templateId);
    let info = await registry.getTemplate(templateId);
    expect(info.verified).to.equal(true);

    // Attempt update from non-admin => revert
    await expect(
      registry.connect(user).updateTemplate(templateId, impl, "2.2", "QmABC123")
    ).to.be.reverted;

    // Admin can do it
    await registry.updateTemplate(templateId, impl, "2.2", "QmABC123");
    info = await registry.getTemplate(templateId);
    expect(info.version).to.equal("2.2");
    expect(info.auditHash).to.equal("QmABC123");

    // Attempt deprecate from non-admin => revert
    await expect(
      registry.connect(user).deprecateTemplate(templateId)
    ).to.be.reverted;

    // Admin can do it
    await registry.deprecateTemplate(templateId);
    info = await registry.getTemplate(templateId);
    expect(info.verified).to.equal(false);
  });

  it("Should allow an upgrade by UPGRADER_ROLE only", async () => {
    // We'll attempt to upgrade to the same contract for demonstration
    const proxyAddress = await registry.getAddress();
    const TemplateRegistryV2 = await ethers.getContractFactory("TemplateRegistry", admin);

    // Another user with no UPGRADER_ROLE tries => revert
    await expect(
      upgrades.upgradeProxy(proxyAddress, TemplateRegistryV2.connect(user))
    ).to.be.reverted;

    // Admin can do it
    await expect(
      upgrades.upgradeProxy(proxyAddress, TemplateRegistryV2.connect(admin))
    ).not.to.be.reverted;
  });
});
