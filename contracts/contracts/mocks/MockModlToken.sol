// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockModlToken is ERC20 {
    constructor() ERC20("Mock MODL", "MMODL") {
        // Mint 1,000,000 tokens (adjust decimals as needed)
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // Public mint function for testing purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
