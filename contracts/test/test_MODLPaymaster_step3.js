const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
require("dotenv").config(); // 🛠️ Load environment variables

const TRUSTED_FORWARDER = process.env.TRUSTED_FORWARDER; // 🛠️ Load your real Trusted Forwarder!
const RELAY_HUB = process.env.RELAY_HUB; // 🛠️ Load your real Trusted Forwarder!

describe("MODLPaymaster Step 3 - Gas Charging Tests (Proxy)", function () {
  let deployer, user;
  let modlPaymaster, modlToken, testTierSystem;
  let gasToModlRate;

  beforeEach(async function () {
    console.log("\n🔄 Resetting network state...");
    await network.provider.send("hardhat_reset");

    [deployer, user] = await ethers.getSigners();
    console.log(`👤 Deployer Address: ${await deployer.getAddress()}`);
    console.log(`👤 Test User Address: ${await user.getAddress()}`);

    try {
      console.log("\n🚀 Deploying MockModlToken...");
      const MockModlToken = await ethers.getContractFactory("MockModlToken");
      modlToken = await MockModlToken.deploy();
      await modlToken.waitForDeployment();
      console.log(`✅ MockModlToken deployed at: ${await modlToken.getAddress()}`);
    } catch (error) {
      console.error("❌ Failed to deploy MockModlToken:", error);
      throw error;
    }

    try {
      console.log("\n🚀 Deploying TestTierSystem...");
      const TestTierSystem = await ethers.getContractFactory("TestTierSystem");
      testTierSystem = await TestTierSystem.deploy(await deployer.getAddress());
      await testTierSystem.waitForDeployment();
      console.log(`✅ TestTierSystem deployed at: ${await testTierSystem.getAddress()}`);
    } catch (error) {
      console.error("❌ Failed to deploy TestTierSystem:", error);
      throw error;
    }

    try {
      console.log("\n🚀 Deploying MODLPaymaster (Proxy)...");
      const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");

      const proxy = await upgrades.deployProxy(
        MODLPaymaster,
        [
          await deployer.getAddress(),           // 1. owner_ ✅
          await modlToken.getAddress(),           // 2. modlToken_ ✅
          await testTierSystem.getAddress(),      // 3. tierSystem_ ✅
          TRUSTED_FORWARDER,                      // 4. trustedForwarder_ ✅ (loaded from .env)
          RELAY_HUB                                                    // 5. relayHub_ ✅ (stub for now)
        ],
        { kind: "uups" }
      );

      await proxy.waitForDeployment();
      modlPaymaster = proxy;
      console.log(`✅ MODLPaymaster Proxy deployed at: ${await proxy.getAddress()}`);
    } catch (error) {
      console.error("❌ Failed to deploy MODLPaymaster (Proxy):", error);
      throw error;
    }

    console.log("\n⚡ Setting gasToModlRate...");
    gasToModlRate = ethers.parseUnits("1", 0);
    await modlPaymaster.setGasToModlRate(gasToModlRate);
    console.log(`✅ gasToModlRate set to: ${gasToModlRate.toString()}`);

    console.log("\n🏷️ Setting user Tier...");
    await testTierSystem.setTier(await user.getAddress(), 1);
    console.log("✅ User Tier set to Tier 1");

    console.log("\n💰 Funding user and Paymaster...");
    await modlToken.mint(await user.getAddress(), ethers.parseUnits("1000", 18));
    await modlToken.connect(user).approve(await modlPaymaster.getAddress(), ethers.parseUnits("500", 18));
    await modlPaymaster.connect(user).depositTokens(ethers.parseUnits("500", 18));
    console.log("✅ User funded and tokens deposited");
  });

  it("✅ Tier 1 user relays transaction and gets charged correctly with no discount", async function () {
    console.log("\n🧪 Starting Tier 1 Test (No Discount)");

    const dummyContext = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256"],
      [
        await user.getAddress(),
        ethers.parseUnits("200", 0),
        ethers.parseUnits("200000", 0)
      ]
    );

    const dummyGasUsed = 150000; // 150,000 gas used
    const expectedUsed = (200 * dummyGasUsed) / 200000; // 150 MODL
    const expectedRefund = 200 - expectedUsed; // 50 MODL refund

    console.log(`💬 Calling preRelayedCall manually...`);
    await modlPaymaster.preRelayedCall(dummyContext);

    console.log(`💬 Calling postRelayedCall manually simulating success...`);
    const tx = await modlPaymaster.postRelayedCall(dummyContext, true, dummyGasUsed);
    const receipt = await tx.wait();

    console.log("🔍 Parsing GasCharge event...");
    const event = receipt.logs
      .map(log => modlPaymaster.interface.parseLog(log))
      .find(parsed => parsed.name === "GasCharge");

    const { user: chargedUser, charge: chargedAmount, refund: refundedAmount } = event.args;

    console.log(`📜 GasCharge Event Details: 
    👤 User: ${chargedUser}
    💸 Charged: ${chargedAmount.toString()} MODL
    💵 Refunded: ${refundedAmount.toString()} MODL
    `);

    // Assertions
    expect(chargedUser).to.equal(await user.getAddress());
    expect(chargedAmount).to.equal(BigInt(expectedUsed));
    expect(refundedAmount).to.equal(BigInt(expectedRefund));

    console.log("✅ Tier 1 Test Passed 🎯");
  });
});
