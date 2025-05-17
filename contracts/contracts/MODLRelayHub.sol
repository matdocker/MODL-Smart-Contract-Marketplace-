// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IMODLPaymaster {
    function preRelayedCall(address user, uint256 gasLimit) external returns (bytes memory context);
    function postRelayedCall(address user, bytes calldata context, uint256 gasUsed) external;
    function payForGas(address user, uint256 gasUsed, uint256 gasPrice) external;
}
contract MODLRelayHub is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    event Relayed(address indexed user, address indexed paymaster, address indexed target, uint256 totalGasUsed);
    event PaymasterDeposited(address indexed paymaster, uint256 amount);
    event PaymasterWithdrawal(address indexed paymaster, uint256 amount);
    event TrustedRelayerUpdated(address indexed newRelayer);
   event DebugGasStats(
        uint256 startGas,
        uint256 midGas,
        uint256 endGas,
        uint256 totalGasUsed,
        uint256 gasPrice,
        uint256 totalCost
    );

    mapping(address => uint256) public deposits;
    address public trustedRelayer;
    
    modifier onlyTrustedRelayer() {
        require(msg.sender == trustedRelayer, "Only trusted relayer");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _trustedRelayer) public initializer {
        require(_trustedRelayer != address(0), "Invalid relayer");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        trustedRelayer = _trustedRelayer;
        emit TrustedRelayerUpdated(_trustedRelayer);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    receive() external payable {}

    // ----- Deposit Management -----

    function depositForPaymaster(address paymaster) external payable {
        require(paymaster != address(0), "Invalid paymaster");
        deposits[paymaster] += msg.value;
        emit PaymasterDeposited(paymaster, msg.value);
    }

    function withdrawDeposit(address payable paymaster, uint256 amount) external {
        require(msg.sender == paymaster, "Unauthorized withdrawal");
        require(deposits[paymaster] >= amount, "Insufficient deposit");
        deposits[paymaster] -= amount;
        (bool success, ) = paymaster.call{value: amount}("");
        require(success, "Withdrawal transfer failed");
        emit PaymasterWithdrawal(paymaster, amount);
    }

    // ----- Admin Management -----

    function setTrustedRelayer(address _trustedRelayer) external onlyOwner {
        require(_trustedRelayer != address(0), "Invalid relayer address");
        trustedRelayer = _trustedRelayer;
        emit TrustedRelayerUpdated(_trustedRelayer);
    }

    // ----- Relay Call Logic -----

    function relayCall(
        address paymaster,
        address target,
        bytes calldata data,
        uint256 gasLimit,
        address user
    ) external onlyTrustedRelayer nonReentrant {
        uint256 startGas = gasleft();

        require(deposits[paymaster] > 0, "Paymaster has zero deposit");

        // 1. Pre-relayed call
        bytes memory context = IMODLPaymaster(paymaster).preRelayedCall(user, gasLimit);

        // 2. Append user address (ERC-2771 style)
        bytes memory dataWithUser = abi.encodePacked(data, abi.encodePacked(user));

        // 3. Sanity check: ensure relayer has enough gas buffer
        require(gasLimit < gasleft() - 5000, "Insufficient gas buffer");

        // 4. Call the target contract
        (bool success, ) = target.call{gas: gasLimit}(dataWithUser);
        require(success, "Target call failed");

        // 5. Post-relayed call with fallback
        uint256 midGas = gasleft();
        try IMODLPaymaster(paymaster).postRelayedCall(user, context, gasLimit - midGas) {
            // success
        } catch {
            revert("PostRelayedCall failed");
        }

        // 6. Calculate total gas used
        uint256 endGas = gasleft();

        // Prevent underflow
        require(startGas >= endGas, "Invalid gas accounting");

        uint256 totalGasUsed;
        unchecked {
            totalGasUsed = (startGas - endGas) + 25000;
        }

        uint256 gasPrice = tx.gasprice;

        emit DebugGasStats(startGas, midGas, endGas, totalGasUsed, gasPrice, 0);

        // Prevent overflow during cost calculation
        require(gasPrice == 0 || totalGasUsed <= type(uint256).max / gasPrice, "Overflow in gas cost");

        uint256 totalCost = totalGasUsed * gasPrice;

        emit DebugGasStats(startGas, midGas, endGas, totalGasUsed, gasPrice, totalCost);

        // Ensure paymaster has enough deposit
        require(deposits[paymaster] >= totalCost, "Insufficient paymaster deposit");
        deposits[paymaster] -= totalCost;

        // Transfer reimbursement to relayer
        (bool reimbursed, ) = payable(msg.sender).call{value: totalCost}("");
        require(reimbursed, "Reimbursement to relayer failed");

        emit Relayed(user, paymaster, target, totalGasUsed);
    }



}
