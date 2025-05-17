// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol"; // ✅ use OpenZeppelin ERC2771Context
import {ITemplateRegistry} from "./interfaces/ITemplateRegistry.sol";

contract TemplateFactory is ERC2771Context {
    ITemplateRegistry public registry;

    event TemplateDeployed(
        address indexed instance,
        bytes32 indexed templateId,
        address indexed user
    );

    constructor(address _registry, address trustedForwarder) ERC2771Context(trustedForwarder) {
        require(_registry != address(0), "Invalid registry address");
        registry = ITemplateRegistry(_registry);
    }

    function deployTemplate(
        bytes32 templateId,
        bytes calldata initData
    ) external returns (address) {
        ITemplateRegistry.Template memory tmpl = registry.getTemplate(templateId);
        require(tmpl.verified, "Template not verified");

        address clone = Clones.clone(tmpl.implementation);
        (bool success, bytes memory data) = clone.call(initData);
        require(success, string(data));

        emit TemplateDeployed(clone, templateId, _msgSender()); // ✅ ERC-2771 compatible user attribution
        return clone;
    }

    // ERC2771Context required overrides
    function _msgSender() internal view override returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
