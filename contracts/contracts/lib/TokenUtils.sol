// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TokenUtils
/// @notice ERC20 Safe Transfer helpers using SafeERC20
library TokenUtils {
    using SafeERC20 for IERC20;

    function safeTransferFromToken(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) internal {
        require(amount > 0, "TokenUtils: amount = 0");
        token.safeTransferFrom(from, to, amount);
    }

    function safeTransferToken(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        require(amount > 0, "TokenUtils: amount = 0");
        token.safeTransfer(to, amount);
    }
}
