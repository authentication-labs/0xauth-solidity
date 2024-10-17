pragma solidity ^0.8.17;
import '../interface/IAccessRegistry.sol';
import '../factory/IIdFactory.sol';

contract xAuthAccessRegistry is IAccessRegistry {
  IIdFactory public factory;

  mapping(bytes32 => bool) access;
  mapping(address => bytes32) institutionalContract;

  event AccessGranted(bytes32 institutionId, address identityAddr);
  event AccessRevoked(bytes32 institutionId, address identityAddr);

  constructor(IIdFactory _factory) {
    factory = _factory;
  }

  function hasAccess(address account, address caller, bytes calldata data) external view override returns (bool) {
    // extract data
    // institutionalContract[]

    (address recipient, uint256 amount) = abi.decode(data[4:], (address, uint256));

    // check the recipient has access to ins
  }

  function grantAccess(bytes32 institutionId, address identityAddr) public {
    bytes32 key = computeKey(institutionId, identityAddr);
    access[key] = true;
    emit AccessGranted(institutionId, identityAddr);
  }

  function revokeAccess(bytes32 institutionId, address identityAddr) public {
    bytes32 key = computeKey(institutionId, identityAddr);
    access[key] = false;
    emit AccessRevoked(institutionId, identityAddr);
  }

  function computeKey(bytes32 institutionId, address identityAddr) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(institutionId, identityAddr));
  }
}
