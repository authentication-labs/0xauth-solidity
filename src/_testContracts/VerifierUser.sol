/* solhint-disable */

// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../verifiers/Verifier.sol";

contract VerifierUser is Verifier {
	constructor() Verifier() {}

	function doSomething() public onlyVerifiedSender {}
}
