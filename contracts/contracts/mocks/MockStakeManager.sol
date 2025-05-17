// contracts/mocks/MockStakeManager.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@opengsn/contracts/src/interfaces/IStakeManager.sol";

contract MockStakeManager {
    mapping(address => uint256) private _fakeStake;

    // --- Helper to set fake stake ---
    function setFakeStake(address relayManager, uint256 amount) external {
        _fakeStake[relayManager] = amount;
    }

    function getFakeStake(
        address relayManager
    ) external view returns (uint256) {
        return _fakeStake[relayManager];
    }

    // --- Only functions RelayHub touches ---
    function getStakeInfo(
        address relayManager
    )
        external
        view
        returns (IStakeManager.StakeInfo memory info, bool authorized)
    {
        info.stake = _fakeStake[relayManager];
        info.unstakeDelay = 1 days;
        info.withdrawTime = 0;
        info.token = IERC20(0x06575CC82c1c86A5da41F14178777c97b7a005EF); // <-- MODL token address instead of address(0)
        authorized = true;
    }

    function isRelayEscheatable(address) external pure returns (bool) {
        return false;
    }

    function updateRelayKeepaliveTime(address) external pure {}

    function penalizeRelayManager(
        address relayManager,
        address payable,
        uint256
    ) external {
        _fakeStake[relayManager] = 0;
    }
}
