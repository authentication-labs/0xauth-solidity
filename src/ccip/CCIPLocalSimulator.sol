// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import { CCIPLocalSimulator } from '@chainlink/local/src/ccip/CCIPLocalSimulator.sol';

// pragma solidity ^0.8.19;

// import { CCIPLocalSimulator, IRouterClient, WETH9, LinkToken, BurnMintERC677Helper } from '@chainlink/local/src/ccip/CCIPLocalSimulator.sol';

// contract Demo {
//   CCIPLocalSimulator public ccipLocalSimulator;

//   function setUp() public {
//     ccipLocalSimulator = new CCIPLocalSimulator();

//     (
//       uint64 chainSelector,
//       IRouterClient sourceRouter,
//       IRouterClient destinationRouter,
//       WETH9 wrappedNative,
//       LinkToken linkToken,
//       BurnMintERC677Helper ccipBnM,
//       BurnMintERC677Helper ccipLnM
//     ) = ccipLocalSimulator.configuration();
//   }
// }
