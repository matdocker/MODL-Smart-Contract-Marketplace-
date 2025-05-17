require('@nomicfoundation/hardhat-ethers');
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
// require("hardhat-dependency-compiler");
require("hardhat-gas-reporter");



module.exports = {
   mocha: {
    timeout: 120_000,        // 2 minutes
  },
  solidity: {
    compilers: [
      {  version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      { version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },

  // compile @opengsn contracts so you can fork and override them
  dependencyCompiler: {
    paths: [
      // "@opengsn/contracts/src/RelayHub.sol",
      "@opengsn/contracts/src/forwarder/Forwarder.sol",
    ],
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    enabled: true,
    currency: "USD",
    gasPrice: 30,
    showTimeSpent: true,
  },

  networks: {
    hardhat: {},

    // for your local GSN testing
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Base Sepolia
    base: {
      url: process.env.BASE_URL || "https://sepolia.base.org",
      chainId: 84532,
      // include only defined keys
      accounts: [
        ...(process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []),
        ...(process.env.PRIVATE_KEY2 ? [process.env.PRIVATE_KEY2] : []),
      ],
      timeout: 120_000,
    },
  },

  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};
