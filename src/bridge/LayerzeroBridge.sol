// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// Import LayerZero interfaces
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { OAppSender, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { OAppCore } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppCore.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import '../factory/IIdFactory.sol';
import { Address } from '@openzeppelin/contracts/utils/Address.sol';
import { BytesLib } from "solidity-bytes-utils/contracts/BytesLib.sol";

contract LayerZeroBridge is Ownable, OAppSender {
    using OptionsBuilder for bytes;
    using BytesLib for bytes;

    address public idFactoryAddress;

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

    event IdFactoryUpdated(address indexed sender, address indexed newAddress);

    constructor(address _amoyEndpointAddress) OAppCore(_amoyEndpointAddress, msg.sender) Ownable() {
        isManager[msg.sender] = true;
        emit AllowedAddress(msg.sender, uint64(AccessAddressTypes.MANAGER), true);

    }

  receive() external payable {}

    function setFactoryAddress(address _idFactoryAddress) external onlyManager {
        idFactoryAddress = _idFactoryAddress;
        emit IdFactoryUpdated(msg.sender, _idFactoryAddress);
    }

    // Options for LayerZero message
    bytes private _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(1000000, 0);

    /**
     * @dev Quotes the gas needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _message The message.
     * @param _payInLzToken Whether to return fee in ZRO token.
     */
    function quote(
        uint32 _dstEid,
        string memory _message,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(_message);
        fee = _quote(_dstEid, payload, _options, _payInLzToken);
    }

function sendLzCreateIdentity(
    uint32 _dstEid,
    bytes32 solanaIdentityOwner, // New parameter for Solana Pubkey
    string memory salt,
    bytes32[] calldata managementKeys
) external payable onlyAllowedSender {
    bytes memory _payload = abi.encode(solanaIdentityOwner, salt, managementKeys);
    bytes memory metaPayload = abi.encode('CreateIdentity', _payload);
    _sendMessage(_dstEid, metaPayload);
}


  function sendLzAddClaim(
    uint32 _dstEid,
    uint256 topic,
    uint256 scheme,
    bytes memory signature,
    bytes memory data,
    string memory uri
  ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, topic, scheme, signature, data, uri);
    bytes memory metaPayload = abi.encode('AddClaim', _payload);
    _sendMessage(_dstEid, metaPayload);
  }

  function sendLzRemoveClaim(
    uint32 _dstEid,
    uint256 _topic
    ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, _topic);
    bytes memory metaPayload = abi.encode('RemoveClaim',_payload);
    _sendMessage(_dstEid, metaPayload);
  }

  function sendLzAddKey(
    uint32 _dstEid,
    bytes32 key,
    uint256 purpose,
    uint256 keyType
  ) external onlyAllowedIdentity(msg.sender) {
    bytes memory _payload = abi.encode(msg.sender, key, purpose, keyType);
    bytes memory metaPayload = abi.encode('AddKey', _payload);
    _sendMessage(_dstEid, metaPayload);
  }

  function sendLzRemoveKey(
    uint32 _dstEid,
    bytes32 key,
    uint256 purpose
  ) external onlyAllowedIdentity(msg.sender) {
     bytes memory _payload = abi.encode(msg.sender, key, purpose);
    bytes memory metaPayload = abi.encode('RemoveKey', _payload);
    _sendMessage(_dstEid, metaPayload);
  }


    function _sendMessage(uint32 _dstEid, bytes memory _payload) internal {
        MessagingFee memory fee = quote(_dstEid, string(_payload), false);
        require(address(this).balance >= fee.nativeFee, "LZBridge: Insufficient contract balance for message delivery");

        _lzSend(
            _dstEid,
            _payload,
            _options,
            fee,
            payable(owner())
        );
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

  // @dev must-have configurations for standard OApps
function setPeer(uint32 _eid, bytes32 _peer) public virtual override onlyOwner {
    peers[_eid] = _peer; // Array of peer addresses by destination.
    emit PeerSet(_eid, _peer); // Event emitted each time a peer is set.
}

  // Function to withdraw native token from the contract
  function withdraw(address _to, uint256 _amount) external onlyManager {
    require(address(this).balance >= _amount, 'Insufficient balance');
    Address.sendValue(payable(_to), _amount);
  }
}