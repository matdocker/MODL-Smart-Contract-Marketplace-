// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {TokenUtils} from "./lib/TokenUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IModlToken is IERC20 {
    function burn(uint256 amount) external;
}

interface ITierSystem {
    function getTier(address user) external view returns (uint8);
}

contract FeeManager is
    Initializable,
    ContextUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using TokenUtils for IModlToken;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public constant FEE_DENOMINATOR = 10_000;

    address public treasury;
    address public founders;

    IModlToken public modlToken;
    ITierSystem public tierSystem;

    uint256 public burnShare;       // in BPS (e.g. 4000 = 40%)
    uint256 public treasuryShare;   // e.g. 3000 = 30%
    uint256 public foundersShare;   // e.g. 3000 = 30%
    uint256 public gasToModlRate;   // e.g. 10 = 10 MODL per gas unit

    uint256[] public tierDiscountBPS;

    address private _trustedForwarder;

    event FeesDistributed(address indexed user, uint8 tier, uint256 baseAmount, uint256 finalAmount, uint256 burnAmount, uint256 treasuryAmount, uint256 foundersAmount);
    event TierDiscountUpdated(uint8 indexed tierIndex, uint256 oldDiscount, uint256 newDiscount);
    event GasToModlRateUpdated(uint256 oldRate, uint256 newRate);
    event TrustedForwarderUpdated(address newForwarder);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _treasury,
        address _founders,
        IModlToken _modlToken,
        ITierSystem _tierSystem,
        uint256 _gasToModlRate,
        address trustedForwarder
    ) public initializer {
        require(trustedForwarder != address(0), "Invalid forwarder");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Context_init();

        treasury = _treasury;
        founders = _founders;
        modlToken = _modlToken;
        tierSystem = _tierSystem;
        _trustedForwarder = trustedForwarder;
        gasToModlRate = _gasToModlRate;

        // 🔒 Hardcoded splits (in BPS)
        burnShare = 4000;     // 40%
        treasuryShare = 3000; // 30%
        foundersShare = 3000; // 30%

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        tierDiscountBPS = [0, 1000, 2000, 3000, 4000];
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
        return forwarder == _trustedForwarder;
    }

    function getTrustedForwarder() external view returns (address) {
        return _trustedForwarder;
    }

    function getFeeSplits() external view returns (uint256 burn, uint256 treasuryAmt, uint256 founderAmt) {
        return (burnShare, treasuryShare, foundersShare);
    }

    function setGasToModlRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate < 1e18, "rate too high");
        emit GasToModlRateUpdated(gasToModlRate, newRate);
        gasToModlRate = newRate;
    }

    function getTierDiscounts() external view returns (uint256[] memory) {
        return tierDiscountBPS;
    }

    function setTierDiscount(uint8 tierIndex, uint256 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tierIndex < tierDiscountBPS.length, "Invalid tier index");
        require(newBps <= FEE_DENOMINATOR, "Discount cannot exceed 100%");
        emit TierDiscountUpdated(tierIndex, tierDiscountBPS[tierIndex], newBps);
        tierDiscountBPS[tierIndex] = newBps;
    }

    function calculateFinalFee(uint256 baseGasAmount, address user) public view returns (uint256 finalAmount, uint256 discountBps, uint8 userTier) {
        userTier = tierSystem.getTier(user);
        require(userTier < tierDiscountBPS.length, "Invalid tier");
        discountBps = tierDiscountBPS[userTier];
        uint256 baseFee = baseGasAmount * gasToModlRate;
        uint256 discount = (baseFee * discountBps) / FEE_DENOMINATOR;
        require(baseFee >= discount, "Overflow in fee math");
        finalAmount = baseFee - discount;
    }

    function collectFee(address user, uint256 gasUsed) external nonReentrant returns (uint256 finalAmount) {
        uint8 userTier;
        uint256 discountBps;
        (finalAmount, discountBps, userTier) = calculateFinalFee(gasUsed, user);
        require(finalAmount > 0, "Zero fee");

        uint256 balance = modlToken.balanceOf(user);
        require(balance >= finalAmount, "Insufficient MODL balance");

        modlToken.safeTransferFromToken(user, address(this), finalAmount);

        uint256 burnAmount = (finalAmount * burnShare) / FEE_DENOMINATOR;
        uint256 treasuryAmount = (finalAmount * treasuryShare) / FEE_DENOMINATOR;
        uint256 foundersAmount = (finalAmount * foundersShare) / FEE_DENOMINATOR;

        if (burnAmount > 0) modlToken.burn(burnAmount);
        if (treasuryAmount > 0) modlToken.safeTransferToken(treasury, treasuryAmount);
        if (foundersAmount > 0) modlToken.safeTransferToken(founders, foundersAmount);
        emit FeesDistributed(user, userTier, gasUsed * gasToModlRate, finalAmount, burnAmount, treasuryAmount, foundersAmount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

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

    uint256[50] private __gap;
}
