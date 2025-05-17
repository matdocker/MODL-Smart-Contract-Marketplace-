const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔍 MODLPaymaster Deployment Check (Step 1)", function () {
  let paymaster;

  const MODL_PAYMASTER_ADDRESS = "0x5AE73F2411023EB21FDbcec19c30EB86EDd6AbD0";
  const EXPECTED_MODL_TOKEN = "0x06575CC82c1c86A5da41F14178777c97b7a005EF";
  const EXPECTED_TIER_SYSTEM = "0x14cA535840aD9e135780Da3a3bdaCDFE8Bf64BBa";
  const EXPECTED_TRUSTED_FORWARDER = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const EXPECTED_RELAY_HUB = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  before(async function () {
    console.log("🔧 Connecting to deployed MODLPaymaster...");

    const MODLPaymaster = await ethers.getContractFactory("MODLPaymaster");
    paymaster = await MODLPaymaster.attach(MODL_PAYMASTER_ADDRESS);

    console.log("📦 MODLPaymaster attached at:", paymaster.target || paymaster.address);
  });

  it("should have the correct MODL token", async function () {
    console.log("➡️  Checking getModlToken()...");
    const modlToken = await paymaster.getModlToken();
    console.log("🔎 Found:", modlToken);
    expect(modlToken).to.equal(EXPECTED_MODL_TOKEN);
  });

  it("should have the correct TierSystem contract", async function () {
    console.log("➡️  Checking getTierSystem()...");
    const tierSystem = await paymaster.getTierSystem();
    console.log("🔎 Found:", tierSystem);
    expect(tierSystem).to.equal(EXPECTED_TIER_SYSTEM);
  });

  it("should have the correct trusted forwarder", async function () {
    console.log("➡️  Checking trustedForwarder()...");
    const forwarder = await paymaster.getTrustedForwarder();
    console.log("🔎 Found:", forwarder);
    expect(forwarder).to.equal(EXPECTED_TRUSTED_FORWARDER);
  });

  it("should have the correct RelayHub address", async function () {
    console.log("➡️  Checking getRelayHub()...");
    const relayHub = await paymaster.getRelayHub();
    console.log("🔎 Found:", relayHub);
    expect(relayHub).to.equal(EXPECTED_RELAY_HUB);
  });
});
