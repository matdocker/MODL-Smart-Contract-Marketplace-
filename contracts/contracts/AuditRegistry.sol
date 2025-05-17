// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {ITemplateRegistry} from "./interfaces/ITemplateRegistry.sol";
import {IStakeManager} from "@opengsn/contracts/src/interfaces/IStakeManager.sol";

interface IMODLToken {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract AuditRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    ITemplateRegistry public templateRegistry;

    enum AuditStatus { Pending, Passed, Failed, Disputed, Verified }

    struct Audit {
        address template;
        address auditor;
        AuditStatus status;
        uint256 timestamp;
        string reportURI;
        uint8 auditorTier;
        string disputeReason;
        address verifier;
    }

    mapping(bytes32 => Audit[]) public audits;

    IMODLToken public modlToken;
    IStakeManager public stakeManager;

    uint256 public rewardAmount;
    uint256 public slashAmount;
    address public slashBeneficiary;

    bytes32[] private templateIds;
    mapping(bytes32 => bool) private templateExists;

    address private _trustedForwarder;

    event AuditSubmitted(bytes32 indexed templateId, address indexed auditor, string reportURI, uint8 auditorTier);
    event AuditDisputed(bytes32 indexed templateId, uint256 auditIndex, address indexed disputor, string disputeReason);
    event AuditVerified(bytes32 indexed templateId, uint256 auditIndex, address indexed verifier);
    event AuditRewarded(address indexed auditor, uint256 amount);
    event AuditPenalized(address indexed auditor, uint256 amount, address beneficiary);
    event TrustedForwarderUpdated(address newForwarder);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address trustedForwarder,
        address templateRegistryAddress,
        address modlTokenAddress,
        address stakeManagerAddress,
        uint256 _rewardAmount,
        uint256 _slashAmount,
        address _slashBeneficiary
    ) public initializer {
        require(trustedForwarder != address(0), "Invalid forwarder");
        require(templateRegistryAddress != address(0), "Invalid TemplateRegistry");
        require(modlTokenAddress != address(0), "Invalid MODL token");
        require(stakeManagerAddress != address(0), "Invalid StakeManager");
        require(_slashBeneficiary != address(0), "Invalid beneficiary");

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _trustedForwarder = trustedForwarder;
        templateRegistry = ITemplateRegistry(templateRegistryAddress);
        modlToken = IMODLToken(modlTokenAddress);
        stakeManager = IStakeManager(stakeManagerAddress);

        rewardAmount = _rewardAmount;
        slashAmount = _slashAmount;
        slashBeneficiary = _slashBeneficiary;

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function updateTrustedForwarder(address newForwarder) external onlyRole(DEFAULT_ADMIN_ROLE) {
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

    function rewardAuditor(address auditor, uint256 amount) internal {
        require(auditor != address(0), "Invalid auditor");
        require(amount > 0, "Amount must be > 0");
        require(modlToken.transfer(auditor, amount), "Reward transfer failed");
        emit AuditRewarded(auditor, amount);
    }

    function slashAuditor(address auditor, uint256 amount) internal {
        require(auditor != address(0), "Invalid auditor");
        require(amount > 0, "Amount must be > 0");
        stakeManager.penalizeRelayManager(auditor, slashBeneficiary, amount);
        emit AuditPenalized(auditor, amount, slashBeneficiary);
    }

    function submitAudit(
        bytes32 templateId,
        address template,
        string calldata reportURI,
        uint8 auditorTier
    ) external onlyRole(AUDITOR_ROLE) {
        require(template != address(0), "Invalid template address");
        require(bytes(reportURI).length > 0, "Report URI required");

        if (!templateExists[templateId]) {
            templateExists[templateId] = true;
            templateIds.push(templateId);
        }

        audits[templateId].push(
            Audit({
                template: template,
                auditor: _msgSender(),
                status: AuditStatus.Pending,
                timestamp: block.timestamp,
                reportURI: reportURI,
                auditorTier: auditorTier,
                disputeReason: "",
                verifier: address(0)
            })
        );

        emit AuditSubmitted(templateId, _msgSender(), reportURI, auditorTier);
    }

    function disputeAudit(
        bytes32 templateId,
        uint256 auditIndex,
        string calldata disputeReason
    ) external {
        require(auditIndex < audits[templateId].length, "Invalid audit index");
        Audit storage audit = audits[templateId][auditIndex];

        require(
            audit.status == AuditStatus.Pending || audit.status == AuditStatus.Passed,
            "Cannot dispute at this stage"
        );
        require(bytes(disputeReason).length > 0, "Reason required");

        audit.status = AuditStatus.Disputed;
        audit.disputeReason = disputeReason;

        emit AuditDisputed(templateId, auditIndex, _msgSender(), disputeReason);
    }

    function verifyAudit(
        bytes32 templateId,
        uint256 auditIndex,
        bool approve
    ) external onlyRole(VERIFIER_ROLE) {
        require(auditIndex < audits[templateId].length, "Invalid audit index");
        Audit storage audit = audits[templateId][auditIndex];

        require(
            audit.status == AuditStatus.Pending || audit.status == AuditStatus.Disputed,
            "Not eligible for verification"
        );

        audit.status = approve ? AuditStatus.Verified : AuditStatus.Failed;
        audit.verifier = _msgSender();

        emit AuditVerified(templateId, auditIndex, _msgSender());

        if (approve) {
            templateRegistry.verifyTemplate(templateId);
            rewardAuditor(audit.auditor, rewardAmount);
        } else {
            slashAuditor(audit.auditor, slashAmount);
        }
    }

    function setTemplateRegistry(address newRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRegistry != address(0), "Invalid address");
        templateRegistry = ITemplateRegistry(newRegistry);
    }

    function setRewardAmount(uint256 newAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardAmount = newAmount;
    }

    function setSlashAmount(uint256 newAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        slashAmount = newAmount;
    }

    function setSlashBeneficiary(address newBeneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newBeneficiary != address(0), "Invalid address");
        slashBeneficiary = newBeneficiary;
    }

    function getAudits(bytes32 templateId) external view returns (Audit[] memory) {
        return audits[templateId];
    }

    function getLatestStatus(bytes32 templateId) external view returns (AuditStatus) {
        Audit[] storage list = audits[templateId];
        if (list.length == 0) return AuditStatus.Pending;
        return list[list.length - 1].status;
    }

    function getTemplateIds() external view returns (bytes32[] memory) {
        return templateIds;
    }

    function getAuditStats(address auditor)
        external
        view
        returns (uint256 total, uint256 pending, uint256 verified, uint256 disputed)
    {
        for (uint i = 0; i < templateIds.length; i++) {
            bytes32 templateId = templateIds[i];
            Audit[] storage list = audits[templateId];
            for (uint j = 0; j < list.length; j++) {
                if (list[j].auditor == auditor) {
                    total++;
                    if (list[j].status == AuditStatus.Pending) pending++;
                    else if (list[j].status == AuditStatus.Verified) verified++;
                    else if (list[j].status == AuditStatus.Disputed) disputed++;
                }
            }
        }
    }

    function isAudited(bytes32 templateId) external view returns (bool) {
        Audit[] storage list = audits[templateId];
        if (list.length == 0) return false;
        return list[list.length - 1].status == AuditStatus.Verified;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
