// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@openzeppelin/contracts/utils/Address.sol";

library AddressLibrary {
    using Address for address;
}

contract MockForwarder is IForwarder {
    using Address for address;

    mapping(address => uint256) private _nonces;
    mapping(bytes32 => bool) private _registeredTypeHashes;
    mapping(bytes32 => bool) private _registeredDomainSeparators;

    // --- Events ---
    event Executed(
        address indexed from,
        address indexed to,
        bool success,
        bytes returnData
    );

    // --- IForwarder Interface Implementation ---

    function getNonce(address from) external view override returns (uint256) {
        return _nonces[from];
    }

    function verify(
        ForwardRequest calldata /*forwardRequest*/,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata /*suffixData*/,
        bytes calldata /*signature*/
    ) public view override {
        require(
            _registeredTypeHashes[requestTypeHash],
            "MockForwarder: unregistered requestTypeHash"
        );
        require(
            _registeredDomainSeparators[domainSeparator],
            "MockForwarder: unregistered domainSeparator"
        );

        // NOTE: In a real Forwarder, signature and nonce would be validated here.
        // This is just a mock, so no signature validation is performed.
    }

    function execute(
        ForwardRequest calldata forwardRequest,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata signature
    ) external payable override returns (bool success, bytes memory ret) {
        verify(
            forwardRequest,
            domainSeparator,
            requestTypeHash,
            suffixData,
            signature
        );

        _nonces[forwardRequest.from] += 1;

        (success, ret) = forwardRequest.to.call{
            gas: forwardRequest.gas,
            value: forwardRequest.value
        }(abi.encodePacked(forwardRequest.data, forwardRequest.from));

        emit Executed(forwardRequest.from, forwardRequest.to, success, ret);
    }

    function registerRequestType(
        string calldata typeName,
        string calldata typeSuffix
    ) external override {
        require(
            bytes(typeSuffix).length > 0,
            "MockForwarder: typeSuffix must not be empty"
        );

        string memory fullType = string(
            abi.encodePacked(
                typeName,
                "(",
                "address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime,",
                typeSuffix,
                ")"
            )
        );

        bytes32 typeHash = keccak256(bytes(fullType));
        _registeredTypeHashes[typeHash] = true;

        emit RequestTypeRegistered(typeHash, fullType);
    }

    function registerDomainSeparator(
        string calldata name,
        string calldata version
    ) external override {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                address(this)
            )
        );

        _registeredDomainSeparators[domainSeparator] = true;

        emit DomainRegistered(
            domainSeparator,
            abi.encode(name, version, chainId, address(this))
        );
    }

    // --- ERC165 Support ---
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IForwarder).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
