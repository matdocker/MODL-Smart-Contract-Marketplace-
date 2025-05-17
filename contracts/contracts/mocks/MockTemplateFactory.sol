// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockTemplateFactory {
    event MockDeployed(bytes32 indexed templateId, address instance);
    uint256 public deploymentCount;

    function deployTemplate(
        bytes32 templateId,
        bytes calldata
    ) external returns (address) {
        deploymentCount++;
        address instance = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            templateId,
                            deploymentCount
                        )
                    )
                )
            )
        );
        emit MockDeployed(templateId, instance);
        return instance;
    }
}
