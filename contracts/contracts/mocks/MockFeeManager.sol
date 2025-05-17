// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockFeeManager {
    uint256 public totalFees;
    uint256 public lastFeeCollected;

    function collectAndDistributeFee(
        address,
        uint8
    ) external returns (uint256) {
        uint256 fee = 100;
        totalFees += fee;
        lastFeeCollected = fee;
        return fee;
    }
}
