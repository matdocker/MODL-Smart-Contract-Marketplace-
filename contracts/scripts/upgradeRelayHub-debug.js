const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "YOUR_EXISTING_PROXY_ADDRESS"; // 🔁 Replace with actual deployed proxy address

  console.log("🧪 Starting MODLRelayHub upgrade...");
  console.log(`🔍 Proxy address: ${proxyAddress}`);

  // Step 1: Fetch contract factory
  const MODLRelayHubV2 = await ethers.getContractFactory("MODLRelayHub");
  console.log("🔧 Contract factory fetched:", MODLRelayHubV2.interface.fragments[0]?.name || "[no name]");

  // Step 2: Fetch current implementation
  const oldImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("📍 Current implementation address:", oldImpl);

  // Step 3: Perform upgrade
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MODLRelayHubV2);
  console.log("🚀 Upgrade transaction submitted...");

  // Step 4: Get new implementation address
  const newImpl = await upgrades.erc1967.getImplementationAddress(upgraded.address);
  console.log("✅ Upgrade complete.");
  console.log("🆕 New implementation address:", newImpl);

  // Step 5: Extra verification
  if (oldImpl === newImpl) {
    console.warn("⚠️ Implementation address did not change. Was the logic actually updated?");
  }
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});
