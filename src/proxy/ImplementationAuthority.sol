// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import '../interface/IImplementationAuthority.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract ImplementationAuthority is IImplementationAuthority, Ownable {
  // the address of implementation of ONCHAINID
  address internal _implementation;

  constructor() {}

  /**
   *  @dev See {IImplementationAuthority-updateImplementation}.
   */
  function updateImplementation(address _newImplementation) external override onlyOwner {
    require(_newImplementation != address(0), 'invalid argument - zero address');
    _implementation = _newImplementation;
    emit UpdatedImplementation(_newImplementation);
  }

  /**
   *  @dev See {IImplementationAuthority-getImplementation}.
   */
  function getImplementation() external view override returns (address) {
    return _implementation;
  }
}
