// scripts/checkRelayHubStatus.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const relayHubAddress = process.env.RELAY_HUB_ADDRESS;
  const paymasterAddress = process.env.PAYMASTER_ADDRESS; // optional, can be hardcoded too

  if (!relayHubAddress) throw new Error("❌ RELAY_HUB_ADDRESS is not set in .env");
  if (!paymasterAddress) throw new Error("❌ PAYMASTER_ADDRESS is not set in .env");

  const relayHubAbi = require("../artifacts/contracts/MODLRelayHub.sol/MODLRelayHub.json").abi;
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const relayHub = new ethers.Contract(relayHubAddress, relayHubAbi, provider);

  const trustedRelayer = await relayHub.trustedRelayer();
  const deposit = await relayHub.deposits(paymasterAddress);

  console.log("\n🔍 MODLRelayHub Status Check");
  console.log("──────────────────────────────────────────────");
  console.log("📍 RelayHub Proxy Address:", relayHubAddress);
  console.log("🤖 Trusted Relayer:", trustedRelayer);
  console.log("💰 Paymaster Deposit:", ethers.formatEther(deposit), "ETH");
  console.log("──────────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
