// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenUtils} from "./lib/TokenUtils.sol"; // adjust path if needed

contract TierSystem is
    Initializable,
    ContextUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ERC721URIStorageUpgradeable,
    ReentrancyGuardUpgradeable
{
    using TokenUtils for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant TIER1_EXPLORER = 100 ether;
    uint256 public constant TIER2_BUILDER = 1_000 ether;
    uint256 public constant TIER3_ARCHITECT = 10_000 ether;
    uint256 public constant TIER4_SENTINEL = 25_000 ether;

    uint256 public constant COOLDOWN = 3 days;
    uint256 public constant ROLLING_WINDOW = 30 days;

    IERC20 public modlToken;
    uint256 private _tokenIdCounter;
    address private _trustedForwarder;

    struct UserStake {
        uint256 currentStake;
        uint256 unstakeCooldown;
        uint256 lastTimestamp;
        uint256 badgeTokenId;
        uint8 currentTier;
    }

    struct Segment {
        uint256 start;
        uint256 amount;
    }

    mapping(address => UserStake) public userStakes;
    mapping(address => Segment[]) public segments;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event BadgeUpdated(address indexed user, uint8 newTier);
    event CooldownSet(address indexed user, uint256 until);
    event TrustedForwarderUpdated(address newForwarder);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _modlToken, address trustedForwarder) public initializer {
        require(_modlToken != address(0), "Invalid token address");
        require(trustedForwarder != address(0), "Invalid forwarder address");

        __Context_init();
        __ERC721_init("MODL Tier Badge", "MTB");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        modlToken = IERC20(_modlToken);
        _trustedForwarder = trustedForwarder;

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(UPGRADER_ROLE, _msgSender());
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

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid stake amount");
        modlToken.safeTransferFromToken(_msgSender(), address(this), amount);

        UserStake storage us = userStakes[_msgSender()];
        us.currentStake += amount;
        us.lastTimestamp = block.timestamp;
        us.unstakeCooldown = block.timestamp + COOLDOWN;

        _finalizeSegment(_msgSender());
        segments[_msgSender()].push(Segment(block.timestamp, us.currentStake));

        emit Staked(_msgSender(), amount);
        _evaluateBadge(_msgSender());
    }

    function unstake(uint256 amount) external nonReentrant {
        UserStake storage us = userStakes[_msgSender()];
        require(amount > 0 && amount <= us.currentStake, "Invalid unstake amount");
        require(block.timestamp >= us.unstakeCooldown, "Cooldown in effect");

        us.currentStake -= amount;
        us.lastTimestamp = block.timestamp;
        us.unstakeCooldown = block.timestamp + COOLDOWN;

        _finalizeSegment(_msgSender());
        segments[_msgSender()].push(Segment(block.timestamp, us.currentStake));

        modlToken.safeTransferToken(_msgSender(), amount);
        emit Unstaked(_msgSender(), amount);
        _evaluateBadge(_msgSender());
    }

    function getTier(address user) public view returns (uint8) {
        uint256 avg = rollingAverageStake(user);
        if (avg >= TIER4_SENTINEL) return 4;
        if (avg >= TIER3_ARCHITECT) return 3;
        if (avg >= TIER2_BUILDER) return 2;
        if (avg >= TIER1_EXPLORER) return 1;
        return 0;
    }

    function rollingAverageStake(address user) public view returns (uint256) {
        Segment[] memory segs = segments[user];
        if (segs.length == 0) return 0;

        uint256 cutoff = block.timestamp - ROLLING_WINDOW;
        uint256 timeWeighted = 0;
        uint256 totalTime = 0;

        for (uint256 i = segs.length; i > 0; i--) {
            Segment memory seg = segs[i - 1];
            uint256 segStart = seg.start;
            uint256 segEnd = (i == segs.length) ? block.timestamp : segs[i].start;
            if (segEnd <= cutoff) break;
            if (segStart < cutoff) segStart = cutoff;

            uint256 duration = segEnd - segStart;
            timeWeighted += duration * seg.amount;
            totalTime += duration;

            if (segStart == cutoff) break;
        }

        return (totalTime == 0) ? segs[segs.length - 1].amount : timeWeighted / totalTime;
    }

    function _evaluateBadge(address user) internal {
        UserStake storage us = userStakes[user];
        uint8 newTier = getTier(user);
        if (newTier == us.currentTier) return;

        if (us.badgeTokenId == 0) {
            _tokenIdCounter++;
            us.badgeTokenId = _tokenIdCounter;
            _safeMint(user, _tokenIdCounter);
        }

        if (newTier == 0) {
            _burn(us.badgeTokenId);
            us.badgeTokenId = 0;
        } else {
            _setTokenURI(us.badgeTokenId, _tierToURI(newTier));
        }

        us.currentTier = newTier;
        emit BadgeUpdated(user, newTier);
    }

    function _tierToURI(uint8 tier) internal pure returns (string memory) {
        if (tier == 1) return "ipfs://badgeExplorer.json";
        if (tier == 2) return "ipfs://badgeBuilder.json";
        if (tier == 3) return "ipfs://badgeArchitect.json";
        if (tier == 4) return "ipfs://badgeSentinel.json";
        return "";
    }

    function _finalizeSegment(address user) internal {
        if (segments[user].length > 0) _pruneSegments(user);
    }

    function _pruneSegments(address user) internal {
        Segment[] storage segs = segments[user];
        uint256 cutoff = block.timestamp - ROLLING_WINDOW;
        while (segs.length > 1 && segs[0].start < cutoff) {
            for (uint256 i = 0; i < segs.length - 1; i++) {
                segs[i] = segs[i + 1];
            }
            segs.pop();
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    // Add this public getter anywhere in the contract
    function getTrustedForwarder() public view returns (address) {
        return _trustedForwarder;
    }

    function updateTrustedForwarder(address forwarder) external onlyRole(ADMIN_ROLE) {
        require(forwarder != address(0), "Invalid forwarder");
        _trustedForwarder = forwarder;
        emit TrustedForwarderUpdated(forwarder);
    }

    // Admin override: This sets tier and badge without affecting staking logic or rolling averages.
    function setTier(address user, uint8 tier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tier <= 4, "Invalid tier");
        
        UserStake storage us = userStakes[user];
        us.currentTier = tier;

        if (tier == 0 && us.badgeTokenId != 0) {
            _burn(us.badgeTokenId);
            us.badgeTokenId = 0;
        } else {
            if (us.badgeTokenId == 0) {
                _tokenIdCounter++;
                us.badgeTokenId = _tokenIdCounter;
                _safeMint(user, _tokenIdCounter);
            }
            _setTokenURI(us.badgeTokenId, _tierToURI(tier));
        }

        emit BadgeUpdated(user, tier);
    }
}
