// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TestTierSystem is Ownable {
    mapping(address => uint8) private _tiers;

    event TierSet(address indexed user, uint8 tier);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setTier(address user, uint8 tier) external onlyOwner {
        _tiers[user] = tier;
        emit TierSet(user, tier);
    }

    function getTier(address user) external view returns (uint8) {
        return _tiers[user];
    }
}
