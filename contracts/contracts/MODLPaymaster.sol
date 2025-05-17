// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IFeeManager {
    function collectFee(address user, uint256 gasUsed) external returns (uint256 finalAmount);
}

contract MODLPaymaster is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    address private _trustedForwarder;
    address public relayHub;
    IFeeManager public feeManager;

    uint256 public constant BPS_DENOMINATOR = 10_000;

    event TrustedForwarderUpdated(address newForwarder);
    event RelayHubUpdated(address newRelayHub);
    event FeeManagerUpdated(address newFeeManager);
    event GaslessTransactionExecuted(address indexed user, address indexed target, bytes data, uint256 gasUsed);
    event GasReimbursed(address indexed relayer, address indexed user, uint256 gasUsed, uint256 totalPaid);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_, address trustedForwarder_) public initializer {
        require(owner_ != address(0), "owner = 0");
        require(trustedForwarder_ != address(0), "fwd = 0");

        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _trustedForwarder = trustedForwarder_;
    }

    /// ===== Admin Functions =====

    function setRelayHub(address relayHub_) external onlyOwner {
        require(relayHub_ != address(0), "Invalid address");
        relayHub = relayHub_;
        emit RelayHubUpdated(relayHub_);
    }

    function setFeeManager(address feeManager_) external onlyOwner {
        require(feeManager_ != address(0), "Invalid FeeManager");
        feeManager = IFeeManager(feeManager_);
        emit FeeManagerUpdated(feeManager_);
    }

    function setTrustedForwarder(address newForwarder) external onlyOwner {
        require(newForwarder != address(0), "Invalid forwarder");
        _trustedForwarder = newForwarder;
        emit TrustedForwarderUpdated(newForwarder);
    }


    /// ===== RelayHub Interaction Functions =====

    modifier onlyRelayHub() {
        require(msg.sender == relayHub, "Only RelayHub allowed");
        _;
    }

    function preRelayedCall(address user, uint256 gasLimit)
        external
        view
        onlyRelayHub
        returns (bytes memory context)
    {
        context = abi.encode(user, gasLimit, block.timestamp);
    }

    function postRelayedCall(address user, bytes calldata, uint256 gasUsed)
        external
        onlyRelayHub
    {
        emit GaslessTransactionExecuted(user, address(this), "", gasUsed);
    }

    function payForGas(address user, uint256 gasUsed, uint256 /* gasPrice */)
        external
        onlyRelayHub
        nonReentrant
    {
        require(address(feeManager) != address(0), "FeeManager not set");

        uint256 paid = feeManager.collectFee(user, gasUsed);
        emit GasReimbursed(msg.sender, user, gasUsed, paid);
    }

    /// ===== Gasless Transaction Executor =====

    function executeGaslessTransaction(address target, bytes calldata data) external nonReentrant {
        require(msg.sender == _trustedForwarder, "Only forwarder allowed");
        require(target != address(0), "Invalid target");

        uint256 startGas = gasleft();

        (bool success, ) = target.call(data);
        require(success, "Gasless transaction failed");

        uint256 gasUsed = startGas - gasleft();
        emit GaslessTransactionExecuted(_msgSender(), target, data, gasUsed);
    }

    /// ===== Public Views =====

    function getTrustedForwarder() external view returns (address) {
        return _trustedForwarder;
    }

    function getRelayHub() external view returns (address) {
        return relayHub;
    }

    function getFeeManager() external view returns (address) {
        return address(feeManager);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _msgSender() internal view override returns (address sender) {
        if (msg.sender == _trustedForwarder && msg.data.length >= 20) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }
}
