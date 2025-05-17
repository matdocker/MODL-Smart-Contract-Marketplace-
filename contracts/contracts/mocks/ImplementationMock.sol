// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ImplementationMock {
    address public owner;

    function initialize(address _owner) external {
        require(owner == address(0), "Already initialized");
        owner = _owner;
    }
}
