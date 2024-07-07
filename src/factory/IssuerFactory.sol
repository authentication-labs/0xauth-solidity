// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;


import "../ClaimIssuer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract IssuerFactory is Ownable {
    event Deployed(address addr, bytes32 salt);

    mapping(bytes32 => bool) private _saltUsed;

    function _deploy(string memory salt, bytes memory bytecode) public returns (address) {
        bytes32 saltBytes = keccak256(abi.encodePacked(salt));
        require(!_saltUsed[saltBytes], "Salt already used");

        address addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let encoded_data := add(0x20, bytecode) // load initialization code.
            let encoded_size := mload(bytecode) // load init code's length.
            addr := create2(0, encoded_data, encoded_size, saltBytes)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit Deployed(addr, saltBytes);
        _saltUsed[saltBytes] = true;
        return addr;
    }

    function deployClaimIssuer(
        string memory salt,
        address implementationAuthority,
        address wallet
    ) public returns (address) {
        bytes memory code = type(ClaimIssuer).creationCode;
        bytes memory constructData = abi.encode(implementationAuthority, wallet);
        bytes memory bytecode = abi.encodePacked(code, constructData);
        return _deploy(salt, bytecode);
    }

    function isSaltUsed(string memory salt) public view returns (bool) {
        bytes32 saltBytes = keccak256(abi.encodePacked(salt));
        return _saltUsed[saltBytes];
    }
}