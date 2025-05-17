const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DeploymentManager Modular Project System (UUPS)", function () {
  let owner, user, trustedForwarder;
  let deploymentManager;
  let templateFactory, tierSystem, feeManager;

  beforeEach(async function () {
    console.log("🚀 Starting beforeEach setup...");

    [owner, user, trustedForwarder] = await ethers.getSigners();
    console.log("✅ Signers ready:", await owner.getAddress(), await user.getAddress(), await trustedForwarder.getAddress());

    const MockTemplateFactory = await ethers.getContractFactory("MockTemplateFactory");
    const MockTierSystem = await ethers.getContractFactory("TestTierSystem");
    const MockFeeManager = await ethers.getContractFactory("MockFeeManager");

    console.log("🔨 Deploying mocks...");
    templateFactory = await MockTemplateFactory.deploy();
    tierSystem = await MockTierSystem.deploy(await owner.getAddress());
    feeManager = await MockFeeManager.deploy();

    await templateFactory.waitForDeployment();
    await tierSystem.waitForDeployment();
    await feeManager.waitForDeployment();
    console.log("✅ Mocks deployed!");

    const DeploymentManager = await ethers.getContractFactory("DeploymentManager");

    console.log("🚀 Deploying DeploymentManager Proxy...");
    deploymentManager = await upgrades.deployProxy(
      DeploymentManager,
      [
        await templateFactory.getAddress(),
        await tierSystem.getAddress(),
        await feeManager.getAddress(),
        await trustedForwarder.getAddress(),
      ],
      { initializer: "initialize" }
    );

    await deploymentManager.waitForDeployment();
    console.log("✅ DeploymentManager Proxy deployed:", await deploymentManager.getAddress());
  });

  it("Should allow a user to create a Project", async function () {
    console.log("🧪 Creating a new project...");
    const tx = await deploymentManager.connect(user).createProject("My First Web3 App");
    const receipt = await tx.wait();
    console.log("✅ ProjectCreated event logs:", receipt.logs);

    const projects = await deploymentManager.getUserProjects(await user.getAddress());
    console.log("✅ Retrieved projects:", projects);

    expect(projects.length).to.equal(1);
    expect(projects[0].name).to.equal("My First Web3 App");
  });

  it("Should deploy a Module into a Project", async function () {
    console.log("🧪 Creating a Project...");
    await deploymentManager.connect(user).createProject("GameCoin Project");
    const projects = await deploymentManager.getUserProjects(await user.getAddress());
    const projectId = projects[0].projectId;

    console.log("🧪 Deploying Module into Project:", projectId);
    const templateId = ethers.id("ERC20Template");
    const initData = "0x1234";
    const metadata = "ERC20 Token Module for GameCoin";

    const tx = await deploymentManager.connect(user).deployTemplateToProject(
      projectId,
      templateId,
      initData,
      metadata
    );

    await expect(tx).to.emit(deploymentManager, "ModuleDeployed");

    const modules = await deploymentManager.getProjectModules(projectId);
    console.log("✅ Retrieved modules:", modules);

    expect(modules.length).to.equal(1);
    expect(modules[0].metadata).to.equal(metadata);
    expect(modules[0].templateId).to.equal(templateId); // ✅ now comparing bytes32 correctly
  });

  it("Should only allow project owner to deploy modules", async function () {
    await deploymentManager.connect(user).createProject("Unauthorized Access Test");
    const projects = await deploymentManager.getUserProjects(await user.getAddress());
    const projectId = projects[0].projectId;

    const templateId = ethers.id("NFTTemplate");
    const initData = "0x5678";
    const metadata = "NFT Marketplace Module";

    console.log("🧪 Checking unauthorized deploy...");
    await expect(
      deploymentManager.deployTemplateToProject(
        projectId,
        templateId,
        initData,
        metadata
      )
    ).to.be.revertedWith("Project owner mismatch: caller is not the owner");
  });

  it("Should track multiple modules in a single project", async function () {
    await deploymentManager.connect(user).createProject("Complex App");
    const projects = await deploymentManager.getUserProjects(await user.getAddress());
    const projectId = projects[0].projectId;

    console.log("🧪 Deploying multiple modules...");
    const modulesToDeploy = [
      { id: ethers.id("ERC20Template"), data: "0x1234", meta: "GameCoin ERC20" },
      { id: ethers.id("NFTTemplate"), data: "0x5678", meta: "Hero NFT Collection" },
      { id: ethers.id("DAOTemplate"), data: "0x9999", meta: "Governance DAO" }
    ];

    for (const m of modulesToDeploy) {
      await deploymentManager.connect(user).deployTemplateToProject(
        projectId,
        m.id,
        m.data,
        m.meta
      );
    }

    const modules = await deploymentManager.getProjectModules(projectId);
    console.log("✅ Retrieved modules:", modules);

    expect(modules.length).to.equal(3);
    expect(modules[0].metadata).to.equal("GameCoin ERC20");
    expect(modules[1].metadata).to.equal("Hero NFT Collection");
    expect(modules[2].metadata).to.equal("Governance DAO");
    expect(modules[0].templateId).to.equal(modulesToDeploy[0].id);
    expect(modules[1].templateId).to.equal(modulesToDeploy[1].id);
    expect(modules[2].templateId).to.equal(modulesToDeploy[2].id);
  });
});
