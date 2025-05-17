const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("💰 MODLPaymaster Deposit & Withdraw (Step 2)", function () {
  // give extra time for Sepolia/Base
  this.timeout(6 * 60 * 1000);

  let deployer, user, paymaster, token;
  const PAYMASTER = "0x5AE73F2411023EB21FDbcec19c30EB86EDd6AbD0";

  // ethers v6 top-level, v5 under ethers.utils
  const parseUnits  = ethers.parseUnits  ?? ethers.utils.parseUnits;
  const parseEther  = ethers.parseEther  ?? ethers.utils.parseEther;
  const formatUnits = ethers.formatUnits ?? ethers.utils.formatUnits;

  before(async () => {
    [deployer] = await ethers.getSigners();
    console.log("✅ Deployer:", deployer.address);

    user = ethers.Wallet.createRandom().connect(ethers.provider);
    console.log("👤 Test user:", user.address);
    await (await deployer.sendTransaction({
      to: user.address,
      value: parseEther("0.0005"),
    })).wait();
    console.log("💰 Funded user with 0.0005 ETH");

    paymaster = await ethers.getContractAt("MODLPaymaster", PAYMASTER);
    console.log("🔗 Paymaster at:", PAYMASTER);

    const tokenAddr = await paymaster.modlToken();
    console.log("✅ modlToken() ⇒", tokenAddr);
    token = await ethers.getContractAt("MODLToken", tokenAddr);
    console.log("🔗 MODLToken at:", token.address);

    // mint & approve
    const mintAmt = parseUnits("1000", 18);
    console.log("💬 Minting", formatUnits(mintAmt, 18), "MODL to user");
    const mtx = await token.connect(deployer).mint(user.address, mintAmt);
    console.log("  ↳ mint tx:", mtx.hash);
    await mtx.wait(1);

    const aprAmt = parseUnits("1000", 18);
    console.log("💬 Approving", formatUnits(aprAmt, 18), "to paymaster");
    const atx = await token.connect(user).approve(PAYMASTER, aprAmt);
    console.log("  ↳ approve tx:", atx.hash);
    await atx.wait(1);
  });

  it("1) deposits 100 MODL correctly", async () => {
    const depositAmt = parseUnits("100", 18);

    console.log("\n--- DEPOSIT ---");
    const beforeUser = await token.balanceOf(user.address);
    const beforePM   = await token.balanceOf(PAYMASTER);
    console.log(
      "  before → user:", formatUnits(beforeUser, 18),
      " pm:",         formatUnits(beforePM,   18)
    );

    const tx = await paymaster.connect(user).depositTokens(depositAmt);
    console.log("↳ depositTokens tx:", tx.hash);
    await tx.wait(1);

    const afterUser = await token.balanceOf(user.address);
    const afterPM   = await token.balanceOf(PAYMASTER);
    console.log(
      "  after  → user:", formatUnits(afterUser, 18),
      " pm:",         formatUnits(afterPM,   18)
    );

    expect(afterUser).to.equal(beforeUser - depositAmt);
    expect(afterPM).to.equal(beforePM + depositAmt);
  });

  it("2) withdraws 50 MODL correctly", async () => {
    const withdrawAmt = parseUnits("50", 18);

    console.log("\n--- WITHDRAW ---");
    const beforeUser = await token.balanceOf(user.address);
    const beforePM   = await token.balanceOf(PAYMASTER);
    console.log(
      "  before → user:", formatUnits(beforeUser, 18),
      " pm:",         formatUnits(beforePM,   18)
    );

    const tx = await paymaster.connect(user).withdrawTokens(withdrawAmt);
    console.log("↳ withdrawTokens tx:", tx.hash);
    await tx.wait(1);

    const afterUser = await token.balanceOf(user.address);
    const afterPM   = await token.balanceOf(PAYMASTER);
    console.log(
      "  after  → user:", formatUnits(afterUser, 18),
      " pm:",         formatUnits(afterPM,   18)
    );

    expect(afterUser).to.equal(beforeUser + withdrawAmt);
    expect(afterPM).to.equal(beforePM - withdrawAmt);
  });
});
