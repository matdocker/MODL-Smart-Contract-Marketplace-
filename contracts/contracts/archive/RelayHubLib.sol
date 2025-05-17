// RelayHubLib.sol
// ─────────────────────────────────────────────────────────────────────────────────
// A minimal library for our core math, so RelayHub’s bytecode shrinks.
//
// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

import "@opengsn/contracts/src/interfaces/IRelayHub.sol";
import "@opengsn/contracts/src/interfaces/IStakeManager.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

library RelayHubLib {
    /// @notice calculate how much to charge paymaster for gasUsed
    function calculateCharge(
        uint256 gasUsed,
        IRelayHub.RelayHubConfig calldata config,
        GsnTypes.RelayData calldata relayData
    ) external view returns (uint256) {
        uint256 basefee = relayData.maxFeePerGas ==
            relayData.maxPriorityFeePerGas
            ? 0
            : block.basefee;
        uint256 price = Math.min(
            relayData.maxFeePerGas,
            Math.min(tx.gasprice, basefee + relayData.maxPriorityFeePerGas)
        );
        // baseRelayFee + gasUsed * price * (pctRelayFee+100) / 100
        return
            config.baseRelayFee +
            (gasUsed * price * (config.pctRelayFee + 100)) /
            100;
    }

    /// @notice calculate the developer’s cut
    function calculateDevCharge(
        uint256 charge,
        IRelayHub.RelayHubConfig calldata config
    ) external pure returns (uint256) {
        uint256 fee = config.devFee;
        if (fee == 0) return 0;
        return (charge * fee) / 100;
    }
}
