// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import "@opengsn/contracts/src/interfaces/IRelayHub.sol";
import "@opengsn/contracts/src/interfaces/IStakeManager.sol";
import "@opengsn/contracts/src/interfaces/IRelayRegistrar.sol";
import "@opengsn/contracts/src/interfaces/IPaymaster.sol";
import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@opengsn/contracts/src/utils/RelayHubValidator.sol";
import "@opengsn/contracts/src/utils/MinLibBytes.sol";
import "@opengsn/contracts/src/utils/GsnUtils.sol";
import "@opengsn/contracts/src/utils/GsnEip712Library.sol";
import "@opengsn/contracts/src/utils/GsnTypes.sol";

import "./RelayHubLib.sol";

// Custom errors for gas efficiency
error HubAlreadyDeprecated();
error DevFeeTooHigh();
error WrongArrayLength();
error NotPaymaster();
error InsufficientFunds();
error TooManyWorkers();
error WorkerAlreadyManaged();
error CallerNotRegistrar();
error RelayWorkerMustBeEOA();
error UnknownWorker();
error RelayManagerNotStaked();
error CalldataSizeExceeded();
error AcceptanceBudgetHigh();
error AcceptanceBudgetLow();
error PaymasterBalanceLow();
error TransactionRejectedByPaymaster();
error MustBeRelayHub();
error RejectedByPreRelayed();
error RejectedByForwarder();
error RejectedByRecipientRevert();
error PostRelayedFailed();
error PaymasterBalanceChanged();
error NotPenalizer();
error RelayServerNotEscheatableYet();
error MsgSenderNotHub();

contract RelayHub is IRelayHub, Ownable, ERC165 {
    using ERC165Checker for address;
    using MinLibBytes for bytes;

    // Constants
    address private constant DRY_RUN_ADDRESS = address(0);

    // Immutables
    IStakeManager internal immutable stakeManager;
    address internal immutable penalizer;
    address internal immutable batchGateway;
    address internal immutable relayRegistrar;
    uint256 internal immutable creationBlock;
    uint256 internal deprecationTime = type(uint256).max;

    // Config and Storage
    RelayHubConfig internal config;
    mapping(IERC20 => uint256) internal minimumStakePerToken;
    mapping(address => address) internal workerToManager;
    mapping(address => uint256) internal workerCount;
    mapping(address => uint256) internal balances;

    // Constructor
    constructor(
        IStakeManager _stakeManager,
        address _penalizer,
        address _batchGateway,
        address _relayRegistrar,
        RelayHubConfig memory _config,
        address initialOwner
    ) Ownable(initialOwner) {
        stakeManager = _stakeManager;
        penalizer = _penalizer;
        batchGateway = _batchGateway;
        relayRegistrar = _relayRegistrar;
        creationBlock = block.number;
        _setConfiguration(_config);
    }

    // Set configuration
    function _setConfiguration(RelayHubConfig memory _config) internal {
        if (_config.devFee >= 100) revert DevFeeTooHigh();
        config = _config;
        emit RelayHubConfigured(config);
    }

    function setConfiguration(
        RelayHubConfig memory _config
    ) external override onlyOwner {
        _setConfiguration(_config);
    }

    function getConfiguration()
        external
        view
        override
        returns (RelayHubConfig memory)
    {
        return config;
    }

    function versionHub() external pure override returns (string memory) {
        return "3.0.0-beta.3+opengsn.hub.irelayhub";
    }

    // Stakes & Workers
    function setMinimumStakes(
        IERC20[] calldata tokens,
        uint256[] calldata stakes
    ) external override onlyOwner {
        if (tokens.length != stakes.length) revert WrongArrayLength();
        for (uint256 i = 0; i < tokens.length; ) {
            minimumStakePerToken[tokens[i]] = stakes[i];
            emit StakingTokenDataChanged(address(tokens[i]), stakes[i]);
            unchecked {
                ++i;
            }
        }
    }

    function getMinimumStakePerToken(
        IERC20 token
    ) external view override returns (uint256) {
        return minimumStakePerToken[token];
    }

    function onRelayServerRegistered(address relayManager) external override {
        if (msg.sender != relayRegistrar) revert CallerNotRegistrar();
        verifyRelayManagerStaked(relayManager);
        if (workerCount[relayManager] == 0) revert TooManyWorkers();
        stakeManager.updateRelayKeepaliveTime(relayManager);
    }

    function addRelayWorkers(
        address[] calldata newRelayWorkers
    ) external override {
        address manager = msg.sender;
        uint256 newCount = workerCount[manager] + newRelayWorkers.length;
        if (newCount > config.maxWorkerCount) revert TooManyWorkers();
        verifyRelayManagerStaked(manager);
        workerCount[manager] = newCount;
        for (uint256 i = 0; i < newRelayWorkers.length; ) {
            if (workerToManager[newRelayWorkers[i]] != address(0))
                revert WorkerAlreadyManaged();
            workerToManager[newRelayWorkers[i]] = manager;
            unchecked {
                ++i;
            }
        }
        emit RelayWorkersAdded(manager, newRelayWorkers, newCount);
    }

    function getWorkerManager(
        address worker
    ) external view override returns (address) {
        return workerToManager[worker];
    }

    function getWorkerCount(
        address manager
    ) external view override returns (uint256) {
        return workerCount[manager];
    }

    // Paymaster Balances
    function depositFor(address target) public payable override {
        if (!target.supportsInterface(type(IPaymaster).interfaceId))
            revert NotPaymaster();
        balances[target] += msg.value;
        emit Deposited(target, msg.sender, msg.value);
    }

    function balanceOf(
        address target
    ) external view override returns (uint256) {
        return balances[target];
    }

    function withdraw(address payable dest, uint256 amount) public override {
        address account = msg.sender;
        if (balances[account] < amount) revert InsufficientFunds();
        balances[account] -= amount;
        (bool success, ) = dest.call{value: amount}("");
        if (!success) revert InsufficientFunds();
        emit Withdrawn(account, dest, amount);
    }

    function withdrawMultiple(
        address payable[] calldata dest,
        uint256[] calldata amounts
    ) external override {
        if (dest.length != amounts.length) revert WrongArrayLength();
        address account = msg.sender;
        for (uint256 i = 0; i < dest.length; ) {
            uint256 amount = amounts[i];
            if (balances[account] < amount) revert InsufficientFunds();
            balances[account] -= amount;
            (bool success, ) = dest[i].call{value: amount}("");
            if (!success) revert InsufficientFunds();
            emit Withdrawn(account, dest[i], amount);
            unchecked {
                ++i;
            }
        }
    }

    // Relay Call Core
    function relayCall(
        string calldata domainSeparatorName,
        uint256 maxAcceptanceBudget,
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData
    )
        external
        override
        returns (
            bool paymasterAccepted,
            uint256 charge,
            RelayCallStatus status,
            bytes memory returnValue
        )
    {
        uint256 initialGasLeft = gasleft();
        bytes32 requestId = GsnUtils.getRelayRequestID(relayRequest, signature);

        if (block.timestamp >= deprecationTime) revert HubAlreadyDeprecated();

        if (msg.sender != batchGateway && tx.origin != DRY_RUN_ADDRESS) {
            if (signature.length == 0) revert RelayWorkerMustBeEOA();
            if (msg.sender != tx.origin) revert RelayWorkerMustBeEOA();
            if (msg.sender != relayRequest.relayData.relayWorker)
                revert UnknownWorker();
        }

        address relayManager = workerToManager[
            relayRequest.relayData.relayWorker
        ];
        if (relayManager == address(0)) revert UnknownWorker();
        verifyRelayManagerStaked(relayManager);

        (
            IPaymaster.GasAndDataLimits memory limits,
            uint256 maxPossibleGas
        ) = verifyGasAndDataLimits(
                maxAcceptanceBudget,
                relayRequest,
                initialGasLeft
            );

        RelayHubValidator.verifyTransactionPacking(
            domainSeparatorName,
            relayRequest,
            signature,
            approvalData
        );

        uint256 innerGasLimit = (gasleft() * 63) / 64 - config.gasReserve;
        uint256 tmpInitialGas = relayRequest
            .relayData
            .transactionCalldataGasUsed +
            initialGasLeft +
            innerGasLimit +
            config.gasOverhead +
            config.postOverhead;

        (bool success, bytes memory innerRet) = address(this).call{
            gas: innerGasLimit
        }(
            abi.encodeWithSelector(
                this.innerRelayCall.selector,
                domainSeparatorName,
                relayRequest,
                signature,
                approvalData,
                limits,
                tmpInitialGas - gasleft(),
                maxPossibleGas
            )
        );

        (status, returnValue) = abi.decode(innerRet, (RelayCallStatus, bytes));
        if (returnValue.length > 0) emit TransactionResult(status, returnValue);

        if (!success) {
            emit TransactionRejectedByPaymaster(
                relayManager,
                relayRequest.relayData.paymaster,
                requestId,
                relayRequest.request.from,
                relayRequest.request.to,
                msg.sender,
                relayRequest.request.data.length >= 4
                    ? relayRequest.request.data.readBytes4(0)
                    : bytes4(0),
                0,
                returnValue
            );
            return (false, 0, status, returnValue);
        }

        uint256 totalGasUsed = relayRequest
            .relayData
            .transactionCalldataGasUsed +
            (initialGasLeft - gasleft()) +
            config.gasOverhead;
        charge = RelayHubLib.calculateCharge(
            totalGasUsed,
            config,
            relayRequest.relayData
        );
        uint256 devCharge = RelayHubLib.calculateDevCharge(charge, config);

        balances[relayRequest.relayData.paymaster] -= charge;
        balances[relayManager] += (charge - devCharge);
        if (devCharge > 0) balances[config.devAddress] += devCharge;

        emit TransactionRelayed(
            relayManager,
            msg.sender,
            requestId,
            relayRequest.request.from,
            relayRequest.request.to,
            relayRequest.relayData.paymaster,
            relayRequest.request.data.length >= 4
                ? relayRequest.request.data.readBytes4(0)
                : bytes4(0),
            status,
            charge
        );

        if (tx.origin == DRY_RUN_ADDRESS) {
            return (true, charge, status, returnValue);
        }
        return (true, charge, status, "");
    }

    function innerRelayCall(
        string calldata domainSeparatorName,
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        IPaymaster.GasAndDataLimits calldata gasAndDataLimits,
        uint256 totalInitialGas,
        uint256 maxPossibleGas
    ) external returns (RelayCallStatus, bytes memory) {
        if (msg.sender != address(this)) revert MsgSenderNotHub();

        uint256 initialGas = gasleft();
        address paymaster = relayRequest.relayData.paymaster;
        uint256 balanceBefore = balances[paymaster];

        (bool preSuccess, bytes memory preRet) = paymaster.call{
            gas: gasAndDataLimits.preRelayedCallGasLimit
        }(
            abi.encodeWithSelector(
                IPaymaster.preRelayedCall.selector,
                relayRequest,
                signature,
                approvalData,
                maxPossibleGas
            )
        );
        if (!preSuccess)
            revertWithStatus(RelayCallStatus.RejectedByPreRelayed, preRet);

        (
            bool forwarderSuccess,
            bool relayedSuccess,
            bytes memory relayedRet
        ) = GsnEip712Library.execute(
                domainSeparatorName,
                relayRequest,
                signature
            );
        if (!forwarderSuccess)
            revertWithStatus(RelayCallStatus.RejectedByForwarder, relayedRet);

        uint256 gasUsed = (totalInitialGas - gasleft()) +
            (initialGas - gasleft());
        (bool postSuccess, ) = paymaster.call{
            gas: gasAndDataLimits.postRelayedCallGasLimit
        }(
            abi.encodeWithSelector(
                IPaymaster.postRelayedCall.selector,
                "",
                relayedSuccess,
                gasUsed,
                relayRequest.relayData
            )
        );
        if (!postSuccess)
            revertWithStatus(RelayCallStatus.PostRelayedFailed, "");

        if (balances[paymaster] < balanceBefore)
            revert PaymasterBalanceChanged();

        return (
            relayedSuccess
                ? RelayCallStatus.OK
                : RelayCallStatus.RelayedCallFailed,
            relayedRet
        );
    }

    function verifyGasAndDataLimits(
        uint256 maxAcceptanceBudget,
        GsnTypes.RelayRequest calldata relayRequest,
        uint256 initialGasLeft
    )
        internal
        view
        returns (
            IPaymaster.GasAndDataLimits memory gasAndDataLimits,
            uint256 maxPossibleGas
        )
    {
        gasAndDataLimits = IPaymaster(relayRequest.relayData.paymaster)
            .getGasAndDataLimits{gas: 50_000}();

        if (msg.data.length > gasAndDataLimits.calldataSizeLimit)
            revert CalldataSizeExceeded();
        if (maxAcceptanceBudget < gasAndDataLimits.acceptanceBudget)
            revert AcceptanceBudgetHigh();
        if (
            gasAndDataLimits.acceptanceBudget <
            gasAndDataLimits.preRelayedCallGasLimit
        ) revert AcceptanceBudgetLow();

        maxPossibleGas =
            relayRequest.relayData.transactionCalldataGasUsed +
            initialGasLeft;

        uint256 maxCharge = RelayHubLib.calculateCharge(
            maxPossibleGas,
            config,
            relayRequest.relayData
        );
        if (maxCharge > balances[relayRequest.relayData.paymaster])
            revert PaymasterBalanceLow();
    }

    function revertWithStatus(
        RelayCallStatus status,
        bytes memory ret
    ) private pure {
        bytes memory data = abi.encode(status, ret);
        GsnEip712Library.truncateInPlace(data);
        assembly {
            revert(add(data, 32), mload(data))
        }
    }

    // Penalize and Stake
    function verifyRelayManagerStaked(
        address relayManager
    ) public view override {
        (IStakeManager.StakeInfo memory info, bool authorized) = stakeManager
            .getStakeInfo(relayManager);
        uint256 minimum = minimumStakePerToken[info.token];
        if (info.token == IERC20(address(0)) || info.stake < minimum)
            revert RelayManagerNotStaked();
        if (!authorized) revert RelayManagerNotStaked();
    }

    function penalize(
        address relayWorker,
        address payable beneficiary
    ) external override {
        if (msg.sender != penalizer) revert NotPenalizer();
        address manager = workerToManager[relayWorker];
        if (manager == address(0)) revert UnknownWorker();
        (IStakeManager.StakeInfo memory info, ) = stakeManager.getStakeInfo(
            manager
        );
        if (info.stake == 0) revert RelayManagerNotStaked();
        stakeManager.penalizeRelayManager(manager, beneficiary, info.stake);
    }

    function deprecateHub(uint256 _time) external override onlyOwner {
        if (block.timestamp >= deprecationTime) revert HubAlreadyDeprecated();
        deprecationTime = _time;
        emit HubDeprecated(_time);
    }

    function isRelayEscheatable(
        address manager
    ) public view override returns (bool) {
        return stakeManager.isRelayEscheatable(manager);
    }

    function escheatAbandonedRelayBalance(
        address manager
    ) external override onlyOwner {
        if (!stakeManager.isRelayEscheatable(manager))
            revert RelayServerNotEscheatableYet();
        uint256 balance = balances[manager];
        balances[manager] = 0;
        balances[config.devAddress] += balance;
        emit AbandonedRelayManagerBalanceEscheated(manager, balance);
    }

    // Getters
    function getCreationBlock() external view override returns (uint256) {
        return creationBlock;
    }

    function getDeprecationTime() external view override returns (uint256) {
        return deprecationTime;
    }

    function getStakeManager() external view override returns (IStakeManager) {
        return stakeManager;
    }

    function getPenalizer() external view override returns (address) {
        return penalizer;
    }

    function getBatchGateway() external view override returns (address) {
        return batchGateway;
    }

    function getRelayRegistrar() external view override returns (address) {
        return relayRegistrar;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IRelayHub).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function aggregateGasleft() external view override returns (uint256) {
        return gasleft();
    }

    function calculateCharge(
        uint256 gasUsed,
        GsnTypes.RelayData calldata relayData
    ) external view override returns (uint256) {
        return RelayHubLib.calculateCharge(gasUsed, config, relayData);
    }

    function calculateDevCharge(
        uint256 charge
    ) external view override returns (uint256) {
        return RelayHubLib.calculateDevCharge(charge, config);
    }

    function isDeprecated() external view override returns (bool) {
        return block.timestamp >= deprecationTime;
    }
}
