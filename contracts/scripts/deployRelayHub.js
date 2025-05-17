const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying RelayHub with deployer:", deployer.address);

  // 🛠 Deploy RelayHubLib first
  const RelayHubLib = await ethers.getContractFactory("RelayHubLib");
  const relayHubLib = await RelayHubLib.deploy();
  await relayHubLib.waitForDeployment();
  console.log("✅ RelayHubLib deployed at:", await relayHubLib.getAddress());

  // 🛠 Now link library and deploy RelayHub
  const RelayHub = await ethers.getContractFactory("contracts/RelayHub.sol:RelayHub", {
    libraries: {
      RelayHubLib: await relayHubLib.getAddress(),
    },
  });

  const stakeManagerAddress = "0x0771c16993b59EbFE02f9ECdE0a9c8D3c7DC13C0"; // existing StakeManager
  const penalizerAddress = "0x39d49576eb3535e2293B080b8907e381BDdd3D97";   // existing Penalizer
  const batchGatewayAddress = ethers.ZeroAddress; // no batch gateway yet
  const relayRegistrarAddress = ethers.ZeroAddress; // no relay registrar yet

  const config = {
    baseRelayFee: 0,
    pctRelayFee: 0,
    devFee: 0,
    devAddress: deployer.address,
    gasReserve: 100000,
    postOverhead: 50000,
    gasOverhead: 50000,
    maximumRecipientDeposit: ethers.parseEther("1"), // 1 ETH
    minimumUnstakeDelay: 1000,
    maxWorkerCount: 10,
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
  console.log("✅ RelayHub deployed at:", await relayHub.getAddress());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
