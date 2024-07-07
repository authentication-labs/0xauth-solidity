// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IIdentity} from "../interface/IIdentity.sol";

contract CrossChainBridge {
    address immutable i_router;
    address immutable i_link;
    address public targetContract;

    event MessageSent(bytes32 messageId);
    event MessageReceived(bytes32 messageId, uint64 sourceChainSelector, address sender, string action);

    constructor(address router, address link, address _targetContract) {
        i_router = router;
        i_link = link;
        targetContract = _targetContract;
    }

    receive() external payable {}

    function sendAddClaim(
        uint64 destinationChainSelector,
        address receiver,
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) external {
        bytes memory payload = abi.encode("AddClaim", topic, scheme, issuer, signature, data, uri);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendRemoveClaim(
        uint64 destinationChainSelector,
        address receiver,
        bytes32 claimId
    ) external {
        bytes memory payload = abi.encode("RemoveClaim", claimId);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendAddKey(
        uint64 destinationChainSelector,
        address receiver,
        bytes32 key,
        uint256 purpose,
        uint256 keyType
    ) external {
        bytes memory payload = abi.encode("AddKey", key, purpose, keyType);
        _sendMessage(destinationChainSelector, receiver, payload);
    }

    function sendRemoveKey(
        uint64 destinationChainSelector,
        address receiver,
        bytes32 key,
        uint256 purpose
    ) external {
        bytes memory payload = abi.encode("RemoveKey", key, purpose);
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
            feeToken: address(0)
        });

        uint256 fee = IRouterClient(i_router).getFee(destinationChainSelector, message);

        bytes32 messageId;

        messageId = IRouterClient(i_router).ccipSend{value: fee}(destinationChainSelector, message);

        emit MessageSent(messageId);
    }

    function handleCrossChainMessage(string memory action, bytes memory data) external {
        require(msg.sender == i_router, "Only router can call this function");

        if (keccak256(bytes(action)) == keccak256(bytes("AddClaim"))) {
            (uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory decodeData, string memory uri) = abi.decode(data, (uint256, uint256, address, bytes, bytes, string));
            IIdentity(targetContract).addClaim(topic, scheme, issuer, signature, decodeData, uri);
        } else if (keccak256(bytes(action)) == keccak256(bytes("RemoveClaim"))) {
            bytes32 claimId = abi.decode(data, (bytes32));
            IIdentity(targetContract).removeClaim(claimId);
        } else if (keccak256(bytes(action)) == keccak256(bytes("AddKey"))) {
            (bytes32 key, uint256 purpose, uint256 keyType) = abi.decode(data, (bytes32, uint256, uint256));
            IIdentity(targetContract).addKey(key, purpose, keyType);
        } else if (keccak256(bytes(action)) == keccak256(bytes("RemoveKey"))) {
            (bytes32 key, uint256 purpose) = abi.decode(data, (bytes32, uint256));
            IIdentity(targetContract).removeKey(key, purpose);
        } else {
            revert("Unknown action");
        }

        emit MessageReceived(keccak256(data), 0, msg.sender, action); // 0 and msg.sender are placeholders
    }
}
