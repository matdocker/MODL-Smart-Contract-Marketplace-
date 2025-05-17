const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("FeeManager", function () {
  let feeManager;
  let token;
  let tierSystem;
  let owner, treasury, founders;

  const trustedForwarderAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";


  beforeEach(async function () {
    [owner, treasury, founders] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    token = await MockToken.deploy("MockMODL", "MMODL");
    await token.waitForDeployment();

    const MockTierSystem = await ethers.getContractFactory("MockTierSystem");
    tierSystem = await MockTierSystem.deploy();
    await tierSystem.waitForDeployment();

    const FeeManager = await ethers.getContractFactory("FeeManager");

    // ✅ Deploy the proxy and call initialize in the same step
    feeManager = await upgrades.deployProxy(FeeManager, [
      treasury.address,
      founders.address,
      token.target,
      tierSystem.target,
      10, // burn
      60, // treasury
      30, // founders
      trustedForwarderAddress // ✅ ensure this is not 0x0
    ], {
      initializer: "initialize"
    });

    await feeManager.waitForDeployment();
  });

  it("Should initialize correctly", async function () {
    expect(await feeManager.treasury()).to.equal(treasury.address);
    expect(await feeManager.founders()).to.equal(founders.address);
    expect(await feeManager.burnShare()).to.equal(10);
  });
});
