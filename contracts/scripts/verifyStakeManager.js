const hre = require("hardhat");
const { run } = hre;

async function main() {
  const stakeManagerAddress = "0xFE4d0dc42617e4B28AB5c92970Ec62C8cf408299"; // update to your deployed address

  // Use the same values from deployStakeManager.js
  const maxUnstakeDelay = 604800; // 7 days
  const abandonmentDelay = 1209600; // 14 days
  const escheatmentDelay = 2592000; // 30 days
  const burnAddress = "0x000000000000000000000000000000000000dEaD";
  const devAddress = "0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5"; // update to your deployer if needed
  const initialOwner = "0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5"; // same as deployer

  console.log("🔍 Verifying StakeManager...");

  try {
    await run("verify:verify", {
      address: stakeManagerAddress,
      constructorArguments: [
        maxUnstakeDelay,
        abandonmentDelay,
        escheatmentDelay,
        burnAddress,
        devAddress,
        initialOwner,
      ],
    });
    console.log("✅ Verification successful!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

main();
