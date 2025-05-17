const { upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x8E0C28657FF05876A04e52DFe885C07Fbb3e3EB3"; // Your proxy

  const impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("🔎 Current implementation address:", impl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
