// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "hardhat/console.sol";

// External interfaces
interface ITemplateFactory {
    function deployTemplate(bytes32 templateId, bytes calldata initData) external returns (address);
}

interface ITierSystem {
    function getTier(address user) external view returns (uint8);
}

interface IFeeManager {
    function collectAndDistributeFee(address payer, uint8 userTier) external returns (uint256);
}

contract DeploymentManager is
    Initializable,
    ContextUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // 🔐 preserve legacy storage layout
    address private _trustedForwarder;
    ITemplateFactory public templateFactory;
    ITierSystem public tierSystem;
    IFeeManager public feeManager;

    struct Project {
        uint256 projectId;
        string name;
        address owner;
        address[] moduleAddresses;
    }

    struct Module {
        bytes32 templateId;
        address deployedAddress;
        string metadata;
    }

    uint256 private _projectIdCounter;
    mapping(address => uint256[]) private _userProjectIds;
    mapping(uint256 => Project) private _projects;
    mapping(uint256 => Module[]) private _projectModules;
    mapping(address => bytes32) private _moduleToTemplateId;

    event TemplateDeployed(address indexed user, address indexed instance, bytes32 templateId);
    event TemplateFactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event TierSystemUpdated(address indexed oldTierSystem, address indexed newTierSystem);
    event FeeManagerUpdated(address indexed oldFeeManager, address indexed newFeeManager);
    event ProjectCreated(uint256 indexed projectId, address indexed owner, string name);
    event ProjectDeleted(uint256 indexed projectId, address indexed owner);
    event ModuleDeployed(uint256 indexed projectId, string templateId, address moduleAddress);
    event TrustedForwarderUpdated(address newForwarder);
    event DebugMsgSender(address sender, address origin, address directSender);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _templateFactory,
        address _tierSystem,
        address _feeManager,
        address trustedForwarder
    ) public initializer {
        __Context_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        templateFactory = ITemplateFactory(_templateFactory);
        tierSystem = ITierSystem(_tierSystem);
        feeManager = IFeeManager(_feeManager);
        _trustedForwarder = trustedForwarder;

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(UPGRADER_ROLE, _msgSender());

        emit TrustedForwarderUpdated(trustedForwarder);
    }

    function updateTrustedForwarder(address newForwarder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newForwarder != address(0), "Invalid forwarder");
        _trustedForwarder = newForwarder;
        emit TrustedForwarderUpdated(newForwarder);
    }

    function setTrustedForwarder(address forwarder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(forwarder != address(0), "Invalid forwarder");
        _trustedForwarder = forwarder;
        emit TrustedForwarderUpdated(forwarder);
    }

    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return forwarder == _trustedForwarder || forwarder == _relayHub;
    }

    function deployWithFee(bytes32 templateId, bytes calldata initData) external nonReentrant returns (address clone) {
        require(templateId != bytes32(0), "Invalid template ID");
        address sender = _msgSender();
        uint8 tier = tierSystem.getTier(sender);
        uint256 feeCollected = feeManager.collectAndDistributeFee(sender, tier);
        require(feeCollected > 0, "Fee collection failed");

        (bool success, bytes memory result) = address(templateFactory).call(
            abi.encodeWithSignature("deployTemplate(bytes32,bytes)", templateId, initData)
        );
        require(success, "Factory call failed");
        clone = abi.decode(result, (address));

        emit TemplateDeployed(sender, clone, templateId);
    }

    function createProject(string calldata name) external returns (uint256 projectId) {
        require(bytes(name).length > 0, "Project name required");

        // 💰 MODL fee collection
        uint8 tier = tierSystem.getTier(_msgSender());
        uint256 feeCollected = feeManager.collectAndDistributeFee(_msgSender(), tier);
        require(feeCollected > 0, "Fee collection failed");

        projectId = ++_projectIdCounter;

        Project storage p = _projects[projectId];
        p.projectId = projectId;
        p.name = name;
        p.owner = _msgSender();
        _userProjectIds[_msgSender()].push(projectId);

        emit ProjectCreated(projectId, _msgSender(), name);
    }

    function deployTemplateToProject(
        uint256 projectId,
        bytes32 templateId,
        bytes calldata initData,
        string calldata metadata
    ) external nonReentrant returns (address clone) {
        Project storage p = _projects[projectId];
        require(p.owner == _msgSender(), "Not project owner");
        require(bytes(p.name).length > 0, "Project does not exist");
        require(templateId != bytes32(0), "Invalid template ID");

        uint8 tier = tierSystem.getTier(_msgSender());
        uint256 feeCollected = feeManager.collectAndDistributeFee(_msgSender(), tier);
        require(feeCollected > 0, "Fee collection failed");

        (bool success, bytes memory result) = address(templateFactory).call(
            abi.encodeWithSignature("deployTemplate(bytes32,bytes)", templateId, initData)
        );
        require(success, "Factory call failed");
        clone = abi.decode(result, (address));
        _moduleToTemplateId[clone] = templateId;

        p.moduleAddresses.push(clone);
        _projectModules[projectId].push(Module({templateId: templateId, deployedAddress: clone, metadata: metadata}));

        emit ModuleDeployed(projectId, string(abi.encodePacked(templateId)), clone);
    }

    function getUserProjects(address user) external view returns (Project[] memory projects) {
        uint256[] storage ids = _userProjectIds[user];
        projects = new Project[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            projects[i] = _projects[ids[i]];
        }
    }

    function deleteProject(uint256 projectId) external nonReentrant {
        address sender = _msgSender();
        Project storage p = _projects[projectId];

        emit DebugMsgSender(sender, tx.origin, msg.sender);

        require(p.owner == sender, "Not project owner");
        require(bytes(p.name).length > 0, "Project does not exist");

        // 💰 MODL fee collection
        uint8 tier = tierSystem.getTier(sender);
        uint256 feeCollected = feeManager.collectAndDistributeFee(sender, tier);
        require(feeCollected > 0, "Fee collection failed");

        uint256[] storage userProjects = _userProjectIds[sender];
        for (uint256 i = 0; i < userProjects.length; i++) {
            if (userProjects[i] == projectId) {
                userProjects[i] = userProjects[userProjects.length - 1];
                userProjects.pop();
                break;
            }
        }

        delete _projects[projectId];
        delete _projectModules[projectId];

        emit ProjectDeleted(projectId, sender);
    }


    function getTemplateIdForModule(address module) external view returns (bytes32) {
        bytes32 tid = _moduleToTemplateId[module];
        require(tid != bytes32(0), "Template ID not found");
        return tid;
    }

    function updateTemplateFactory(address newFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFactory != address(0), "Invalid address");
        emit TemplateFactoryUpdated(address(templateFactory), newFactory);
        templateFactory = ITemplateFactory(newFactory);
    }

    function updateTierSystem(address newTierSystem) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTierSystem != address(0), "Invalid address");
        emit TierSystemUpdated(address(tierSystem), newTierSystem);
        tierSystem = ITierSystem(newTierSystem);
    }

    function updateFeeManager(address newFeeManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeManager != address(0), "Invalid address");
        emit FeeManagerUpdated(address(feeManager), newFeeManager);
        feeManager = IFeeManager(newFeeManager);
    }

    function setRelayHub(address newRelayHub) external AccessControlUpgradeable.onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRelayHub != address(0), "Invalid relay hub");
        _relayHub = newRelayHub;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function _msgSender() internal view override returns (address sender) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }

    function _msgData() internal view override returns (bytes calldata) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    function getTemplateFactoryAddress() public view returns (address) {
        return address(templateFactory);
    }

    address private _relayHub; // 👈 Moved here, safe location

    uint256[43] private __gap;
}
