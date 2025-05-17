module.exports = [
    "0x0771c16993b59EbFE02f9ECdE0a9c8D3c7DC13C0", // stakeManagerAddress
    "0x39d49576eb3535e2293B080b8907e381BDdd3D97", // penalizerAddress
    "0x0000000000000000000000000000000000000000", // batchGatewayAddress
    "0x0000000000000000000000000000000000000000", // relayRegistrarAddress
    {
      baseRelayFee: 0,
      pctRelayFee: 0,
      devFee: 0,
      devAddress: "0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5",
      gasReserve: 100000,
      postOverhead: 50000,
      gasOverhead: 50000,
      maximumRecipientDeposit: "1000000000000000000",
      minimumUnstakeDelay: 1000,
      maxWorkerCount: 10
    },
    "0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5" // deployerAddress
  ];
  