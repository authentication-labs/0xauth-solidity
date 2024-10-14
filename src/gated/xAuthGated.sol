// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import '../interface/IIdentity.sol';
import '../factory/IIdFactory.sol';
import '../interface/IClaimIssuer.sol';

uint256 constant CLAIM_BASIC_IDENTITY = 10101000100001;
uint256 constant CLAIM_FINANCIAL = 10101020100001;

contract xAuthGated {
  IIdFactory public identityFactory;
  IClaimIssuer private claimIssuer;

  address private owner;

  constructor(address _idFactory, address _claimIssuer) {
    identityFactory = IIdFactory(_idFactory);
    claimIssuer = IClaimIssuer(_claimIssuer);
  }

  /**
   * Usage example:
   *
   * function mint(to) requireClaim(msg.sender, CLAIM_FINANCIAL)
   *
   * @param claim claim required
   */

  modifier requireClaim(address wallet, uint256 claim) {
    _validateClaim(wallet, claim);
    _;
  }

  function _validateClaim(address wallet, uint256 requiredTopic) private view {
    address identityAddr = identityFactory.getIdentity(wallet);
    require(identityAddr != address(0), 'no identity contract found');

    bytes32 claimId = keccak256(abi.encode(claimIssuer, requiredTopic));

    (uint256 topic, , , bytes memory signature, bytes memory data, ) = IIdentity(identityAddr).getClaim(claimId);

    bool isValid = claimIssuer.isClaimValid(IIdentity(identityAddr), topic, signature, data);
    require(isValid, 'Claim is not valid or unauthorized');
  }
}
