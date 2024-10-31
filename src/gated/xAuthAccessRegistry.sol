// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;
import '../interface/IAccessRegistry.sol';
import '../factory/IIdFactory.sol';
import '../interface/IClaimIssuer.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

contract xAuthAccessRegistry is IAccessRegistry, Ownable, ERC165 {
  IIdFactory public factory;
  IClaimIssuer public claimIssuer;

  mapping(bytes32 => bool) public access;
  mapping(address => bytes32) public fundsContract;
  mapping(bytes32 => uint256[]) public requiredClaims;

  event AccessGranted(bytes32 fundId, address identityAddr);
  event AccessRevoked(bytes32 fundId, address identityAddr);
  event RequiredClaimsUpdated(bytes32 fundId, uint256[] claimTopics);

  constructor(IIdFactory _factory, IClaimIssuer _claimIssuer) Ownable() {
    factory = _factory;
    claimIssuer = _claimIssuer;
  }

  function updateFactory(IIdFactory _factory) external onlyOwner {
    factory = _factory;
  }

  function updateClaimIssuer(IClaimIssuer _claimIssuer) external onlyOwner {
    claimIssuer = _claimIssuer;
  }

  function hasAccess(address account, address caller, bytes calldata data) external view override returns (bool) {
    address identity = factory.getIdentity(account);

    // require(senderIdentity != address(0), 'sender identity is null');

    // extract data

    // (address recipient, uint256 amount) = abi.decode(data[4:], (address, uint256));

    require(identity != address(0), 'account identity is null');

    // check the recipient has access to institutional contract

    // COMENTED FOR TESTING
    // bytes32 fundId = fundsContract[msg.sender];
    // require(access[computeKey(fundId, receiverIdentity)] == true, "receiver identity doesn't have access");

    // check the recipient has require claims
    // uint256[] memory requiredClaimTopics = requiredClaims[fundId];

    // for (uint256 i = 0; i < requiredClaimTopics.length; ++i) {
    //   bytes32 claimId = keccak256(abi.encode(claimIssuer, requiredClaimTopics[i]));

    //   (uint256 topic, , , bytes memory signature, bytes memory claimData, ) = IIdentity(receiverIdentity).getClaim(
    //     claimId
    //   );

    //   bool isValid = claimIssuer.isClaimValid(IIdentity(receiverIdentity), topic, signature, claimData);
    //   require(isValid, 'Claim is not valid');
    // }

    return true;
  }

  function grantAccess(bytes32 fundId, address identityAddr) public onlyOwner {
    bytes32 key = computeKey(fundId, identityAddr);
    access[key] = true;
    emit AccessGranted(fundId, identityAddr);
  }

  function updateRequiredClaims(bytes32 fundId, uint256[] calldata claimTopics) public onlyOwner {
    requiredClaims[fundId] = claimTopics;
    emit RequiredClaimsUpdated(fundId, claimTopics);
  }

  function revokeAccess(bytes32 fundId, address identityAddr) public onlyOwner {
    bytes32 key = computeKey(fundId, identityAddr);
    access[key] = false;
    emit AccessRevoked(fundId, identityAddr);
  }

  function computeKey(bytes32 fundId, address identityAddr) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(fundId, identityAddr));
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    if (interfaceId == type(IAccessRegistry).interfaceId) {
      return true;
    }
    return super.supportsInterface(interfaceId);
  }
}
