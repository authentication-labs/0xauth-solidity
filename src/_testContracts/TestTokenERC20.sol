// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../interface/IAccessRegistry.sol';

contract TestTokenERC20 is ERC20 {
  IAccessRegistry public accessRegistry;

  constructor(IAccessRegistry _accessRegistry) ERC20('TestToken', 'TTK') {
    accessRegistry = _accessRegistry;
    _mint(msg.sender, 1000 * 10 ** decimals());
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    if (address(accessRegistry) != address(0) && from != address(0) && to != address(0)) {
      require(accessRegistry.hasAccess(from, _msgSender(), _msgData()), "sender doesn't have access");
      require(accessRegistry.hasAccess(to, _msgSender(), _msgData()), "recipient doesn't have access");
    }
  }
}
