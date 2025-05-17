// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev A mock "target" contract that we call via GSN. 
 *      We'll just set a variable or do some trivial operation 
 *      to demonstrate that the call is made.
 */
contract MockTarget {
    uint256 public state;

    event StateUpdated(uint256 oldValue, uint256 newValue);

    function doSomething(uint256 newValue) external {
        emit StateUpdated(state, newValue);
        state = newValue;
    }
}
