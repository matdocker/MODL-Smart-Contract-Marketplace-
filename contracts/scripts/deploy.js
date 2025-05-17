const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying RelayHub with deployer:", deployer.address);

  const RelayHub = await ethers.getContractFactory("contracts/RelayHub.sol:RelayHub");

  const stakeManagerAddress = "0x0771c16993b59EbFE02f9ECdE0a9c8D3c7DC13C0";
  const penalizerAddress = "0x39d49576eb3535e2293B080b8907e381BDdd3D97";
  const batchGatewayAddress = ethers.ZeroAddress;
  const relayRegistrarAddress = ethers.ZeroAddress;

  const config = {
    baseRelayFee: 0,
    pctRelayFee: 0,
    devFee: 0,
    devAddress: deployer.address,
    gasReserve: 100000,
    postOverhead: 50000,
    gasOverhead: 50000,
    maximumRecipientDeposit: ethers.parseEther("1"),
    minimumUnstakeDelay: 1000,
    maxWorkerCount: 10
  };

  const relayHub = await RelayHub.deploy(
    stakeManagerAddress,
    penalizerAddress,
    batchGatewayAddress,
    relayRegistrarAddress,
    config,
    deployer.address
  );

  await relayHub.waitForDeployment();
  const deployedAddress = await relayHub.getAddress();
  console.log("✅ RelayHub deployed at:", deployedAddress);

  // 🛠 Print auto-generated verify command
  console.log("\n🔵 Run this to verify:");
  console.log(`npx hardhat verify --network base ${deployedAddress} "${stakeManagerAddress}" "${penalizerAddress}" "${batchGatewayAddress}" "${relayRegistrarAddress}" '${JSON.stringify({
    baseRelayFee: config.baseRelayFee,
    pctRelayFee: config.pctRelayFee,
    devFee: config.devFee,
    devAddress: config.devAddress,
    gasReserve: config.gasReserve,
    postOverhead: config.postOverhead,
    gasOverhead: config.gasOverhead,
    maximumRecipientDeposit: config.maximumRecipientDeposit.toString(), // important
    minimumUnstakeDelay: config.minimumUnstakeDelay,
    maxWorkerCount: config.maxWorkerCount
  }).replace(/"(\w+)":/g, '$1:').replace(/"/g, '\\"')}' "${deployer.address}"`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
