// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@opengsn/contracts/src/ERC2771Recipient.sol";

/**
 * A minimal recipient that uses the GSN's Forwarder for meta-tx.
 * `ERC2771Recipient` expects to have a "trustedForwarder" set, e.g. the forwarder deployed by the GSN.
 */
contract SimpleRecipient is ERC2771Recipient {
    event MessageEmitted(address sender, string message);

    constructor(address forwarder) {
        _setTrustedForwarder(forwarder);
    }

    function emitMessage(string memory message) public {
        // _msgSender() is from ERC2771Recipient
        emit MessageEmitted(_msgSender(), message);
    }

    function versionRecipient() external pure returns (string memory) {
        return "1.0";
    }
}
