const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TierSystem (UUPS + GSN)", function () {
  let tierSystem;
  let admin, user, forwarder;
  let token;
  // Set expectedCooldown to match the contract's COOLDOWN: 3 days = 259200 seconds
  const expectedCooldown = 3 * 24 * 60 * 60; // 259200 seconds

  beforeEach(async function () {
    [admin, user, forwarder] = await ethers.getSigners();

    // Deploy a mock ERC20 token for staking
    const Token = await ethers.getContractFactory("MockModlToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    // Mint tokens to the user for staking
    await token.mint(user.address, ethers.parseEther("10000"));

    // Deploy TierSystem as UUPS proxy with the token and forwarder addresses
    const TierSystem = await ethers.getContractFactory("TierSystem");
    tierSystem = await upgrades.deployProxy(
      TierSystem,
      [await token.getAddress(), forwarder.address],
      { initializer: "initialize" }
    );
    await tierSystem.waitForDeployment();
  });

  it("Should allow staking and update stake state", async () => {
    const stakeAmount = ethers.parseEther("500");

    await token.connect(user).approve(await tierSystem.getAddress(), stakeAmount);
    await tierSystem.connect(user).stake(stakeAmount);

    const stake = await tierSystem.userStakes(user.address);
    expect(stake.currentStake).to.equal(stakeAmount);
    expect(await tierSystem.getTier(user.address)).to.equal(1); // Tier 1 expected
  });

  it("Should not allow unstake before cooldown", async () => {
    const stakeAmount = ethers.parseEther("500");

    await token.connect(user).approve(await tierSystem.getAddress(), stakeAmount);
    await tierSystem.connect(user).stake(stakeAmount);

    // Immediately attempt to unstake; expect revert with "Cooldown in effect"
    await expect(tierSystem.connect(user).unstake(stakeAmount))
      .to.be.revertedWith("Cooldown in effect");
  });

  it("Should allow unstake after cooldown period", async () => {
    const stakeAmount = ethers.parseEther("500");

    await token.connect(user).approve(await tierSystem.getAddress(), stakeAmount);
    await tierSystem.connect(user).stake(stakeAmount);

    // Increase time by the contract's cooldown period plus a small buffer (10 seconds)
    await ethers.provider.send("evm_increaseTime", [expectedCooldown + 10]);
    await ethers.provider.send("evm_mine");

    // Now unstake should succeed (i.e. not revert)
    await expect(tierSystem.connect(user).unstake(stakeAmount)).to.not.be.reverted;
  });

  it("Should correctly mint and update badges", async () => {
    const amount = ethers.parseEther("1000"); // Should qualify for Tier 2
    await token.connect(user).approve(await tierSystem.getAddress(), amount);
    await tierSystem.connect(user).stake(amount);

    const stake = await tierSystem.userStakes(user.address);
    expect(stake.badgeTokenId).to.not.equal(0);
    expect(await tierSystem.getTier(user.address)).to.equal(2);
  });

  it("Should allow upgrade by UPGRADER_ROLE only", async () => {
    const TierSystemV2 = await ethers.getContractFactory("TierSystem");
    const proxyAddress = await tierSystem.getAddress();

    // Expect upgrade attempt by a non-admin to revert
    await expect(upgrades.upgradeProxy(proxyAddress, TierSystemV2.connect(user)))
      .to.be.reverted;
    // Upgrade attempt by the admin should succeed
    await expect(upgrades.upgradeProxy(proxyAddress, TierSystemV2.connect(admin)))
      .to.not.be.reverted;
  });
});
