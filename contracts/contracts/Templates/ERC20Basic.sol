// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Basic is ERC20 {
    constructor() ERC20("ERC20Basic", "BASIC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
