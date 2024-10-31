// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

// Chainlink
import { IRouterClient } from '@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol';
import { CCIPReceiver } from '@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol';
import { Client } from '@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol';
// OpenZeppelin
import { Address } from '@openzeppelin/contracts/utils/Address.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
// Interfaces
import { IIdentity } from '../interface/IIdentity.sol';
import { Gateway } from '../gateway/Gateway.sol';
import '../factory/IIdFactory.sol';

contract CrossChainBridge is CCIPReceiver, ReentrancyGuard {
  /// @notice REMOVE for prod
  string public ccipMessage;

  address immutable i_router;
  address public idFactoryAddress;

  // Map to store the messageIds of the messages sent
  mapping(bytes32 => bool) public messageIds;

  // Map to store allowedContracts
  mapping(address => bool) public isAllowedContract;

  // Map to store onlyManagers
  mapping(address => bool) public isManager;

  // Define the enum
  enum AccessAddressTypes {
    CONTRACT,
    MANAGER
  }

  modifier onlyAllowedSender {
    require(
      isAllowedContract[msg.sender] == true || isManager[msg.sender] == true,
      'Permissions: Sender is not a allowed'
    );
    _;
  }

  modifier onlyAllowedContract() {
    require(isAllowedContract[msg.sender] == true, 'Permissions: Sender is not a allowed contract');
    _;
  }

  modifier onlyManager() {
    require(isManager[msg.sender] == true, 'Permissions: Sender is not a Manager');
    _;
  }

  modifier onlyAllowedIdentity(address _identity) {
    IIdFactory idFactory = IIdFactory(idFactoryAddress);
    require(idFactory.identityIsCreated(_identity), 'Permissions: idFactory marks this address as not identity');
    _;
  }

  event AllowedAddress(address indexed _address, uint64 indexed _type, bool indexed _status);

  event MessageSent(bytes32 indexed messageId);
  event MessageReceived(
    bytes32 messageId,
    uint64 indexed sourceChainSelector,
    address indexed sender,
    string indexed action
  );
  event IdFactoryUpdated(address indexed sender, address indexed newAddress);

  constructor(address _router) CCIPReceiver(_router) {
    i_router = _router;
    isManager[msg.sender] = true;
    emit AllowedAddress(msg.sender, uint64(AccessAddressTypes.MANAGER), true);
  }

  receive() external payable {}

  function setFactoryAddress(address _idFactoryAddress) external onlyManager {
    idFactoryAddress = _idFactoryAddress;
    emit IdFactoryUpdated(msg.sender, _idFactoryAddress);
  }

  function sendAddClaim(
    uint64 destinationChainSelector,
    address receiver,
    uint256 topic,
    uint256 scheme,
    address issuer,
    bytes memory signature,
    bytes memory data,
    string memory uri
  ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, topic, scheme, issuer, signature, data, uri);
    bytes memory metaPayload = abi.encode('AddClaim', _payload);
    _sendMessage(destinationChainSelector, receiver, metaPayload);
  }

  function sendRemoveClaim(
    uint64 destinationChainSelector,
    address receiver,
    bytes32 claimId
  ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, claimId);
    bytes memory metaPayload = abi.encode('RemoveClaim',_payload);
    _sendMessage(destinationChainSelector, receiver, metaPayload);
  }

  function sendAddKey(
    uint64 destinationChainSelector,
    address receiver,
    bytes32 key,
    uint256 purpose,
    uint256 keyType
  ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, key, purpose, keyType);
    bytes memory metaPayload = abi.encode('AddKey', _payload);
    _sendMessage(destinationChainSelector, receiver, metaPayload);
  }

  function sendRemoveKey(
    uint64 destinationChainSelector,
    address receiver,
    bytes32 key,
    uint256 purpose
  ) external onlyAllowedIdentity(msg.sender) {
     bytes memory _payload = abi.encode(msg.sender, key, purpose);
    bytes memory metaPayload = abi.encode('RemoveKey', _payload);
    _sendMessage(destinationChainSelector, receiver, metaPayload);
  }

  function sendCreateIdentity(
    uint64 destinationChainSelector,
    address receiver,
    address gateway,
    address identityOwner,
    string memory salt,
    bytes32[] calldata managementKeys
  ) external onlyAllowedSender {
    bytes memory _payload = abi.encode(gateway, identityOwner, salt, managementKeys);
    bytes memory metaPayload = abi.encode('CreateIdentity', _payload);
    _sendMessage(destinationChainSelector, receiver, metaPayload);
  }

  function _sendMessage(uint64 destinationChainSelector, address receiver, bytes memory payload) internal nonReentrant {
    (uint256 fee, Client.EVM2AnyMessage memory message) = calculateFeeAndMessage(
      destinationChainSelector,
      receiver,
      payload
    );

    bytes32 messageId = IRouterClient(i_router).ccipSend{ value: fee }(destinationChainSelector, message);

    emit MessageSent(messageId);
  }

  function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    // Check if the message was already processed
    require(!messageIds[message.messageId], 'Message already processed');
    messageIds[message.messageId] = true;
    // Decode the message data
    (string memory action, bytes memory _payload) = abi.decode(message.data, (string, bytes));
    if (keccak256(bytes(action)) == keccak256(bytes('AddClaim'))) {
        (
          address targetContract,
          uint256 topic,
          uint256 scheme,
          address issuer,
          bytes memory signature,
          bytes memory decodedData,
          string memory uri
        ) = abi.decode(_payload, (address, uint256, uint256, address, bytes, bytes, string));
        IIdentity(targetContract).addClaim(topic, scheme, issuer, signature, decodedData, uri);
      } else if (keccak256(bytes(action)) == keccak256(bytes('RemoveClaim'))) {
        (address targetIdentity, bytes32 claimId) = abi.decode(_payload, (address,bytes32));
        IIdentity(targetIdentity).removeClaim(claimId);
    } else if (keccak256(bytes(action)) == keccak256(bytes('AddKey'))) {
      (address targetIdentity, bytes32 key, uint256 purpose, uint256 keyType) = abi.decode(
        _payload,
        (address, bytes32, uint256, uint256)
      );
      IIdentity(targetIdentity).addKey(key, purpose, keyType);
      } else if (keccak256(bytes(action)) == keccak256(bytes('RemoveKey'))) {
        (address targetIdentity, bytes32 key, uint256 purpose) = abi.decode(_payload, (address, bytes32, uint256));
        IIdentity(targetIdentity).removeKey(key, purpose);
    } else if (keccak256(bytes(action)) == keccak256(bytes('CreateIdentity'))) {
      (address targetContract, address identityOwner, string memory salt, bytes32[] memory managementKeys) = abi.decode(
        _payload,
        (address, address, string, bytes32[])
      );
      Gateway(targetContract).deployIdentity(identityOwner, salt, managementKeys);
    } else {
      revert('Unknown action');
    }
    emit MessageReceived(message.messageId, message.sourceChainSelector, abi.decode(message.sender, (address)), action);
  }

  // Function to set allowed contracts
  function setAllowedContract(address _contract, bool _status) external onlyManager {
    if (_status == true) {
      require(Address.isContract(_contract), 'Permissions: Address is not a contract');
    }
    isAllowedContract[_contract] = _status;

    emit AllowedAddress(_contract, uint64(AccessAddressTypes.CONTRACT), _status);
  }

  // Function to set manager status
  function setManager(address _manager, bool _status) external onlyManager {
    isManager[_manager] = _status;

    emit AllowedAddress(_manager, uint64(AccessAddressTypes.MANAGER), _status);
  }

  /// @notice REMOVE for prod
  function testSendMessage(
    uint64 _destinationChainSelector,
    address _receiver,
    string memory _message
  ) public onlyAllowedSender {
    bytes memory payload = abi.encode(_message);
    _sendMessage(_destinationChainSelector, _receiver, payload);
  }

  /// @notice REMOVE for prod
  function _testRecieveMessage(Client.Any2EVMMessage memory any2EvmMessage) internal {
    bytes32 s_lastReceivedMessageId = any2EvmMessage.messageId; // fetch the messageId
    ccipMessage = abi.decode(any2EvmMessage.data, (string)); // abi-decoding of the sent text
    emit MessageReceived(s_lastReceivedMessageId, 0, msg.sender, ccipMessage);
  }

  function calculateFeeAndMessage(
    uint64 destinationChainSelector,
    address receiver,
    bytes memory payload
  ) public view returns (uint256 fee, Client.EVM2AnyMessage memory message) {
    message = Client.EVM2AnyMessage({
      receiver: abi.encode(receiver),
      data: payload,
      tokenAmounts: new Client.EVMTokenAmount[](0),
      extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 1000000 })),
      feeToken: address(0) // Use native token
    });
    fee = IRouterClient(i_router).getFee(destinationChainSelector, message);
    return (fee, message);
  }

  // Function to withdraw native token from the contract
  function withdraw(address _to, uint256 _amount) external onlyManager nonReentrant {
    require(address(this).balance >= _amount, 'Insufficient balance');
    Address.sendValue(payable(_to), _amount);
  }
}
