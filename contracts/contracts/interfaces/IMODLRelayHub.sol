// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IMODLRelayHub {
    function deposits(address user) external view returns (uint256);
    function relayCall(address paymaster, address target, bytes calldata data, uint256 gasLimit) external;
}
