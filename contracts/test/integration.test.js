require("dotenv").config();
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { RelayProvider } = require("@opengsn/provider");

describe("MODL DeploymentManager Integration", function () {
  this.timeout(90000);

  const addresses = {
    MODLToken: "0x06575CC82c1c86A5da41F14178777c97b7a005EF",
    TierSystem: "0x14cA535840aD9e135780Da3a3bdaCDFE8Bf64BBa",
    FeeManager: "0x0463D87C8329Ad1Da3cc9876C52df3F910041A47",
    TemplateRegistry: "0x6042d3758cBDEeb7D714A8c094B417838E9b013e",
    TemplateFactory: "0x3f162197634E37DB7F73eC4E9bC86369DDEA21a7",
    DeploymentManager: "0xBC7e41034c028724de34C7AeE97De6758fae8761",
    MODLPaymaster: "0x5AE73F2411023EB21FDbcec19c30EB86EDd6AbD0"
  };

  let deployer, user;
  let templateRegistry, deploymentManager, tierSystem;

  beforeEach(async function () {
    const provider = ethers.provider;
    deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    user = deployer;

    templateRegistry = await ethers.getContractAt("TemplateRegistry", addresses.TemplateRegistry, deployer);
    deploymentManager = await ethers.getContractAt("DeploymentManager", addresses.DeploymentManager, deployer);
    tierSystem = await ethers.getContractAt("TierSystem", addresses.TierSystem, deployer);
  });

  async function registerTemplate(name) {
    const tx = await templateRegistry.registerTemplate(
      deployer.address,
      name,
      "1.0.0",
      0
    );
    const receipt = await tx.wait();
    return receipt.logs[0].args[0]; // templateId
  }

  async function createGSNProvider(provider, paymasterAddress) {
    const config = {
      paymasterAddress,
      loggerConfiguration: { logLevel: "error" },
    };
    const rawProvider = provider._webProvider || provider.provider;
    const gsnProvider = await RelayProvider.newProvider({ provider: rawProvider, config }).init();
    return new ethers.BrowserProvider(gsnProvider);
  }

  it("should deploy template using deployWithFee()", async function () {
    const templateId = await registerTemplate("BasicTemplate");

    const tx = await deploymentManager.deployWithFee(
      templateId,
      ethers.encodeBytes32String("InitData")
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => log.fragment?.name === "TemplateDeployed");
    expect(event).to.exist;
    expect(event.args.templateId).to.equal(templateId);
    expect(event.args.user).to.equal(user.address);
  });

  it("should create a project and deploy module to it", async function () {
    const createTx = await deploymentManager.createProject("MyProject");
    const receipt = await createTx.wait();
    const projectId = receipt.logs.find(log => log.fragment?.name === "ProjectCreated").args.projectId;

    const templateId = await registerTemplate("ModuleTemplate");

    const deployTx = await deploymentManager.deployTemplateToProject(
      projectId,
      templateId,
      ethers.encodeBytes32String("ModuleData"),
      "module-meta.json"
    );
    const deployReceipt = await deployTx.wait();

    const event = deployReceipt.logs.find(log => log.fragment?.name === "ModuleDeployed");
    expect(event.args.projectId).to.equal(projectId);
    expect(event.args.templateId).to.be.a("string");
  });

  it("should list all user projects", async function () {
    const projectTx1 = await deploymentManager.createProject("Alpha");
    await projectTx1.wait();

    const projectTx2 = await deploymentManager.createProject("Beta");
    await projectTx2.wait();

    const projects = await deploymentManager.getUserProjects(user.address);
    expect(projects.length).to.be.greaterThanOrEqual(2);
    expect(projects.map(p => p.name)).to.include("Alpha").and.include("Beta");
  });

  it("should revert if template deployment fails due to low tier", async function () {
    if (typeof tierSystem.setTier === "function") {
      const tx = await tierSystem.setTier(user.address, 0);
      await tx.wait();
    }

    const templateId = await registerTemplate("LowTierFail");

    await expect(
      deploymentManager.deployWithFee(templateId, ethers.encodeBytes32String("X"))
    ).to.be.reverted;
  });

  it("should deploy via gasless GSN if tier sufficient", async function () {
    const templateId = await registerTemplate("GaslessGSN");

    const gsnProvider = await createGSNProvider(ethers.provider, addresses.MODLPaymaster);
    let gsnSigner = await gsnProvider.getSigner();

    gsnSigner = {
      ...gsnSigner,
      getAddress: async () => gsnSigner.address,
    };

    const gsnDeploymentManager = await ethers.getContractAt("DeploymentManager", addresses.DeploymentManager, gsnSigner);

    const tx = await gsnDeploymentManager.deployWithFee(templateId, ethers.encodeBytes32String("GaslessInit"));
    const receipt = await tx.wait();

    const logs = receipt.logs.filter(log => log.fragment?.name === "TemplateDeployed");
    expect(logs.length).to.be.greaterThan(0);
  });
});
