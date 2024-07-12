// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IIdentity} from "../interface/IIdentity.sol";
import {Gateway} from "../gateway/Gateway.sol";

contract CrossChainBridge {
    address immutable i_router;

    // Map to store the messageIds of the messages sent
    mapping(bytes32 => bool) public messageIds;

    event MessageSent(bytes32 messageId);
    event MessageReceived(bytes32 messageId, uint64 sourceChainSelector, address sender, string action);

    constructor(address router) {
        i_router = router;
    }

    receive() external payable {}

    function sendCreateIdentity(
        uint64 destinationChainSelector,
        address receiver,
        address gateway,
        address identityOwner,
        string memory salt,
        bytes32[] calldata managementKeys,
        uint256 signatureExpiry,
        bytes calldata signature
    ) external {
        bytes memory payload = abi.encode("CreateIdentity", gateway, identityOwner, salt, managementKeys, signatureExpiry, signature);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendAddClaim(
        uint64 destinationChainSelector,
        address receiver,
        address identity,
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) external {
        bytes memory payload = abi.encode("AddClaim", identity, topic, scheme, issuer, signature, data, uri);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendRemoveClaim(
        uint64 destinationChainSelector,
        address receiver,
        address identity,
        bytes32 claimId
    ) external {
        bytes memory payload = abi.encode("RemoveClaim", identity, claimId);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendAddKey(
        uint64 destinationChainSelector,
        address receiver,
        address identity, 
        bytes32 key,
        uint256 purpose,
        uint256 keyType
    ) external {
        bytes memory payload = abi.encode("AddKey", identity, key, purpose, keyType);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendRemoveKey(
        uint64 destinationChainSelector,
        address receiver,
        address identity, 
        bytes32 key,
        uint256 purpose
    ) external {
        bytes memory payload = abi.encode("RemoveKey",identity, key, purpose);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function _sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        bytes memory payload
    ) internal {

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: "",
            feeToken: address(0) // Use native token
        });

        uint256 fee = IRouterClient(i_router).getFee(destinationChainSelector, message);

        bytes32 messageId = IRouterClient(i_router).ccipSend{value: fee}(destinationChainSelector, message);

        emit MessageSent(messageId);
    }

    function handleCrossChainMessage(Client.Any2EVMMessage memory message) external {
        require(msg.sender == i_router, "Only router can call this function");

        // Check if the message was already processed
        require(!messageIds[message.messageId], "Message already processed");
        messageIds[message.messageId] = true;

        // Decode the message data
        (string memory action, address targetContract, bytes memory data) = abi.decode(message.data, (string, address, bytes));

        if (keccak256(bytes(action)) == keccak256(bytes("AddClaim"))) {
            (uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory decodedData, string memory uri) = abi.decode(data, (uint256, uint256, address, bytes, bytes, string));
            IIdentity(targetContract).addClaim(topic, scheme, issuer, signature, decodedData, uri);
        } else if (keccak256(bytes(action)) == keccak256(bytes("RemoveClaim"))) {
            bytes32 claimId = abi.decode(data, (bytes32));
            IIdentity(targetContract).removeClaim(claimId);
        } else if (keccak256(bytes(action)) == keccak256(bytes("AddKey"))) {
            (bytes32 key, uint256 purpose, uint256 keyType) = abi.decode(data, (bytes32, uint256, uint256));
            IIdentity(targetContract).addKey(key, purpose, keyType);
        } else if (keccak256(bytes(action)) == keccak256(bytes("RemoveKey"))) {
            (bytes32 key, uint256 purpose) = abi.decode(data, (bytes32, uint256));
            IIdentity(targetContract).removeKey(key, purpose);
        } else if (keccak256(bytes(action)) == keccak256(bytes("CreateIdentity"))) {
            (address identityOwner, string memory salt, bytes32[] memory managementKeys, uint256 signatureExpiry, bytes memory signature) = abi.decode(data, (address, string, bytes32[], uint256, bytes));
            Gateway(targetContract).deployIdentityWithSaltAndManagementKeys(identityOwner, salt, managementKeys, signatureExpiry, signature);
        } else {
            revert("Unknown action");
        }

        emit MessageReceived(message.messageId, message.sourceChainSelector, abi.decode(message.sender, (address)), action);
    }
}
