// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITemplateRegistry {
    struct Template {
        address implementation;
        string name;
        string version;
        address author;
        bool verified;
        uint8 templateType;
        string auditHash;
    }

    event DebugUpgrade(string msg);
    event TemplateRegistered(
        bytes32 indexed templateId,
        address implementation,
        string name,
        string version,
        address author
    );
    event TemplateVerified(bytes32 indexed templateId, address verifier);
    event TemplateDeprecated(bytes32 indexed templateId);
    event TemplateUpdated(
        bytes32 indexed templateId,
        address newImplementation,
        string newVersion,
        string newAuditHash
    );
    event SubmitterRoleGranted(address indexed user);
    event TrustedForwarderUpdated(address newForwarder);

    function registerTemplate(
        address implementation,
        string calldata name,
        string calldata version,
        uint8 templateType
    ) external returns (bytes32);

    function updateTemplate(
        bytes32 templateId,
        address newImplementation,
        string calldata newVersion,
        string calldata newAuditHash
    ) external;

    function verifyTemplate(bytes32 templateId) external;

    function deprecateTemplate(bytes32 templateId) external;

    function getTemplate(bytes32 templateId) external view returns (Template memory);

    function getTemplateCount() external view returns (uint256);

    function getTemplateIdByIndex(uint256 index) external view returns (bytes32);

    function getAllTemplateIds() external view returns (bytes32[] memory);

    function isTrustedForwarder(address forwarder) external view returns (bool);
}
