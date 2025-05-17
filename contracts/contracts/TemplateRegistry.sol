// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

interface IStakeManager {
    function getStakeAmount(address user) external view returns (uint256);
}

contract TemplateRegistry is
    Initializable,
    ContextUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
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

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    mapping(bytes32 => Template) private _templates;
    bytes32[] private _templateIds;
    mapping(string => mapping(string => bool)) public nameVersionUsed;

    IStakeManager public stakeManager;
    address private _trustedForwarder;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address trustedForwarder, address _stakeManager) public initializer {
        require(_stakeManager != address(0), "Invalid StakeManager");
        require(trustedForwarder != address(0), "Invalid forwarder");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Context_init();

        _trustedForwarder = trustedForwarder;
        stakeManager = IStakeManager(_stakeManager);

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(UPGRADER_ROLE, _msgSender());
        _grantRole(VERIFIER_ROLE, _msgSender());
    }

    function updateTrustedForwarder(address newForwarder) external onlyRole(ADMIN_ROLE) {
        require(newForwarder != address(0), "Invalid forwarder");
        _trustedForwarder = newForwarder;
        emit TrustedForwarderUpdated(newForwarder);
    }

    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return forwarder == _trustedForwarder;
    }

    function _msgSender() internal view override returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }

    function _msgData() internal view override returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    function grantSubmitterRole(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SUBMITTER_ROLE, user);
        emit SubmitterRoleGranted(user);
    }

    function requestSubmitterRole() external {
        require(address(stakeManager) != address(0), "StakeManager not set");
        uint256 stakeAmount = stakeManager.getStakeAmount(_msgSender());
        require(stakeAmount >= 5000 * 1e18, "Not enough MODL staked");
        _grantRole(SUBMITTER_ROLE, _msgSender());
        emit SubmitterRoleGranted(_msgSender());
    }

    function registerTemplate(
        address implementation,
        string calldata name,
        string calldata version,
        uint8 templateType
    ) external returns (bytes32 templateId) {
        require(implementation != address(0), "Invalid implementation address");
        require(bytes(name).length > 0, "Name required");
        require(bytes(version).length > 0, "Version required");
        require(hasRole(SUBMITTER_ROLE, _msgSender()), "Submitter role required");
        require(!nameVersionUsed[name][version], "Name + version already used");

        templateId = keccak256(
            abi.encodePacked(_msgSender(), block.timestamp, implementation, name, version, templateType)
        );

        require(_templates[templateId].implementation == address(0), "Template already exists");

        Template memory newTemplate = Template({
            implementation: implementation,
            name: name,
            version: version,
            author: _msgSender(),
            verified: false,
            templateType: templateType,
            auditHash: ""
        });

        _templates[templateId] = newTemplate;
        _templateIds.push(templateId);
        nameVersionUsed[name][version] = true;

        emit TemplateRegistered(templateId, implementation, name, version, _msgSender());
        emit DebugUpgrade("TemplateRegistry upgraded successfully");
    }

    function updateTemplate(
        bytes32 templateId,
        address newImplementation,
        string calldata newVersion,
        string calldata newAuditHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_templates[templateId].implementation != address(0), "Template not exist");
        require(newImplementation != address(0), "Invalid new implementation");
        require(bytes(newVersion).length > 0, "New version required");

        Template storage template = _templates[templateId];
        template.implementation = newImplementation;
        template.version = newVersion;
        template.auditHash = newAuditHash;

        emit TemplateUpdated(templateId, newImplementation, newVersion, newAuditHash);
    }

    function verifyTemplate(bytes32 templateId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_templates[templateId].implementation != address(0), "Template not exist");
        _templates[templateId].verified = true;
        emit TemplateVerified(templateId, _msgSender());
    }

    function deprecateTemplate(bytes32 templateId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_templates[templateId].implementation != address(0), "Template not exist");
        _templates[templateId].verified = false;
        emit TemplateDeprecated(templateId);
    }

    function getTemplate(bytes32 templateId) external view returns (Template memory) {
        require(_templates[templateId].implementation != address(0), "Template not exist");
        return _templates[templateId];
    }

    function getTemplateCount() external view returns (uint256) {
        return _templateIds.length;
    }

    function getTemplateIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < _templateIds.length, "Index out of bounds");
        return _templateIds[index];
    }

    function getAllTemplateIds() external view returns (bytes32[] memory) {
        return _templateIds;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
