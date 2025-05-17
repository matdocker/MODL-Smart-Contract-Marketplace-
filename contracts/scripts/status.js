const { ethers } = require("hardhat");

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`🧪 Running diagnostics on network: ${network.name} (${network.chainId})\n`);

  // 🛠️ Load contracts
  const paymasterAddress = process.env.MODL_PAYMASTER_PROXY;
  const relayHubAddress = process.env.RELAY_HUB_ADDRESS;
  const deploymentManagerAddress = process.env.DEPLOYMENT_MANAGER_PROXY;
  const relayerAddress = process.env.FORWARDER_ADDRESS;

  if (!paymasterAddress || !relayHubAddress || !deploymentManagerAddress || !relayerAddress) {
    throw new Error("❌ Missing environment variables in .env");
  }

  const Paymaster = await ethers.getContractAt("MODLPaymaster", paymasterAddress);
  const RelayHub = await ethers.getContractAt("MODLRelayHub", relayHubAddress);
  const DeploymentManager = await ethers.getContractAt("DeploymentManager", deploymentManagerAddress);

  // ✅ Fetch values in parallel
  const [
    paymasterRelayHub,
    paymasterTF,
    isTF,
    deposit,
    relayerInfo
  ] = await Promise.all([
    Paymaster.getRelayHub(),
    Paymaster.getTrustedForwarder(),
    DeploymentManager.isTrustedForwarder(await Paymaster.getTrustedForwarder()),
    RelayHub.deposits(paymasterAddress),
    (async () => {
      try {
        return await RelayHub.getRelayWorkerInfo(relayerAddress);
      } catch {
        return null;
      }
    })()
  ]);

  const balanceEth = ethers.formatEther(deposit);

  // 🧾 Output summary
  console.log("🔎 Diagnostics Summary:");
  console.table({
    "Paymaster ETH": `${balanceEth} ETH`,
    "RelayHub Set": paymasterRelayHub === relayHubAddress,
    "Trusted Forwarder Set": isTF,
    "Relayer Staked": relayerInfo !== null
  });

  // 📦 Raw debug info
  console.log("\n📦 Raw Details:");
  console.log({
    paymasterRelayHub,
    expectedRelayHub: relayHubAddress,
    paymasterTF,
    isTrustedForwarder: isTF,
    deposit: deposit.toString(),
    relayerInfo
  });
}

main().catch((err) => {
  console.error("❌ Diagnostic script failed:");
  console.error(err);
  process.exit(1);
});
