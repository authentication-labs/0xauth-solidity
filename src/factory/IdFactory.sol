// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../proxy/IdentityProxy.sol";
import "./IIdFactory.sol";
import "../interface/IERC734.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IdFactory is IIdFactory, Ownable {
	mapping(address => bool) private _tokenFactories;

	// address of the _implementationAuthority contract making the link to the implementation contract
	address private immutable _implementationAuthority;

	// as it is not possible to deploy 2 times the same contract address, this mapping allows us to check which
	// salt is taken and which is not
	mapping(string => bool) private _saltTaken;

	// ONCHAINID of the wallet owner
	mapping(address => address) private _userIdentity;

	// wallets currently linked to an ONCHAINID
	mapping(address => address[]) private _wallets;

	// ONCHAINID of the token
	mapping(address => address) private _tokenIdentity;

	// token linked to an ONCHAINID
	mapping(address => address) private _tokenAddress;

	// flag to check if the contract is on the home chain
	bool public _isHomeChain;

	// DetinationChainSelectors and Receivers address (Receiver is the Bridge contract on the destination chain)
	mapping(uint64 => address) public destinationChainSelectorToReceiver;
	uint64[] private chainSelectors;

	// CrossChainBridge address
	address public bridge;

	// setting
	constructor(address implementationAuthority, bool isHomeChain) {
		require(implementationAuthority != address(0), "invalid argument - zero address");
		_implementationAuthority = implementationAuthority;
		_isHomeChain = isHomeChain;
	}

	/**
	 *  @dev See {IdFactory-addTokenFactory}.
	 */
	function addTokenFactory(address _factory) external override onlyOwner {
		require(_factory != address(0), "invalid argument - zero address");
		require(!isTokenFactory(_factory), "already a factory");
		_tokenFactories[_factory] = true;
		emit TokenFactoryAdded(_factory);
	}

	/**
	 *  @dev See {IdFactory-removeTokenFactory}.
	 */
	function removeTokenFactory(address _factory) external override onlyOwner {
		require(_factory != address(0), "invalid argument - zero address");
		require(isTokenFactory(_factory), "not a factory");
		_tokenFactories[_factory] = false;
		emit TokenFactoryRemoved(_factory);
	}

	/**
	 *  @dev See {IdFactory-createIdentity}.
	 */
	function createIdentity(address _wallet, string memory _salt) external override onlyOwner returns (address) {
		require(_wallet != address(0), "invalid argument - zero address");
		require(keccak256(abi.encode(_salt)) != keccak256(abi.encode("")), "invalid argument - empty string");
		string memory oidSalt = string.concat("OID", _salt);
		require(!_saltTaken[oidSalt], "salt already taken");
		require(_userIdentity[_wallet] == address(0), "wallet already linked to an identity");
		address identity = _deployIdentity(oidSalt, _implementationAuthority, _wallet);
		_saltTaken[oidSalt] = true;
		_userIdentity[_wallet] = identity;
		_wallets[identity].push(_wallet);
		emit WalletLinked(_wallet, identity);
		return identity;
	}

	/**
	 *  @dev See {IdFactory-createIdentityWithManagementKeys}.
	 */
	function createIdentityWithManagementKeys(
		address _wallet,
		string memory _salt,
		bytes32[] memory _managementKeys
	) external override onlyOwner returns (address) {
		require(_wallet != address(0), "invalid argument - zero address");
		require(keccak256(abi.encode(_salt)) != keccak256(abi.encode("")), "invalid argument - empty string");
		string memory oidSalt = string.concat("OID", _salt);
		require(!_saltTaken[oidSalt], "salt already taken");
		require(_userIdentity[_wallet] == address(0), "wallet already linked to an identity");
		require(_managementKeys.length > 0, "invalid argument - empty list of keys");

		address identity = _deployIdentity(oidSalt, _implementationAuthority, address(this));

		for (uint i = 0; i < _managementKeys.length; i++) {
			require(
				_managementKeys[i] != keccak256(abi.encode(_wallet)),
				"invalid argument - wallet is also listed in management keys"
			);
			IERC734(identity).addKey(_managementKeys[i], 1, 1);
		}

		IERC734(identity).removeKey(keccak256(abi.encode(address(this))), 1);

		_saltTaken[oidSalt] = true;
		_userIdentity[_wallet] = identity;
		_wallets[identity].push(_wallet);
		emit WalletLinked(_wallet, identity);

		return identity;
	}

	/**
	 *  @dev See {IdFactory-createTokenIdentity}.
	 */
	function createTokenIdentity(
		address _token,
		address _tokenOwner,
		string memory _salt
	) external override returns (address) {
		require(isTokenFactory(msg.sender) || msg.sender == owner(), "only Factory or owner can call");
		require(_token != address(0), "invalid argument - zero address");
		require(_tokenOwner != address(0), "invalid argument - zero address");
		require(keccak256(abi.encode(_salt)) != keccak256(abi.encode("")), "invalid argument - empty string");
		string memory tokenIdSalt = string.concat("Token", _salt);
		require(!_saltTaken[tokenIdSalt], "salt already taken");
		require(_tokenIdentity[_token] == address(0), "token already linked to an identity");
		address identity = _deployIdentity(tokenIdSalt, _implementationAuthority, _tokenOwner);
		_saltTaken[tokenIdSalt] = true;
		_tokenIdentity[_token] = identity;
		_tokenAddress[identity] = _token;
		emit TokenLinked(_token, identity);
		return identity;
	}

	/**
	 *  @dev See {IdFactory-linkWallet}.
	 */
	function linkWallet(address _newWallet) external override {
		require(_newWallet != address(0), "invalid argument - zero address");
		require(_userIdentity[msg.sender] != address(0), "wallet not linked to an identity contract");
		require(_userIdentity[_newWallet] == address(0), "new wallet already linked");
		require(_tokenIdentity[_newWallet] == address(0), "invalid argument - token address");
		address identity = _userIdentity[msg.sender];
		require(_wallets[identity].length < 101, "max amount of wallets per ID exceeded");
		_userIdentity[_newWallet] = identity;
		_wallets[identity].push(_newWallet);
		emit WalletLinked(_newWallet, identity);
	}

	/**
	 *  @dev See {IdFactory-unlinkWallet}.
	 */
	function unlinkWallet(address _oldWallet) external override {
		require(_oldWallet != address(0), "invalid argument - zero address");
		require(_oldWallet != msg.sender, "cannot be called on sender address");
		require(_userIdentity[msg.sender] == _userIdentity[_oldWallet], "only a linked wallet can unlink");
		address _identity = _userIdentity[_oldWallet];
		delete _userIdentity[_oldWallet];
		uint256 length = _wallets[_identity].length;
		for (uint256 i = 0; i < length; i++) {
			if (_wallets[_identity][i] == _oldWallet) {
				_wallets[_identity][i] = _wallets[_identity][length - 1];
				_wallets[_identity].pop();
				break;
			}
		}
		emit WalletUnlinked(_oldWallet, _identity);
	}

	/**
	 *  @dev See {IdFactory-addReceiver}.
	 */

	function addReceiver(uint64 _chainSelector, address _receiver) external override onlyOwner {
		require(_receiver != address(0), "invalid argument - zero address");
		require(destinationChainSelectorToReceiver[_chainSelector] == address(0), "receiver already added");
		destinationChainSelectorToReceiver[_chainSelector] = _receiver;
		chainSelectors.push(_chainSelector);
		emit ReceiverAdded(_chainSelector, _receiver);
	}

	/**
	 *  @dev See {IdFactory-removeReceiver}.
	 */

	function removeReceiver(uint64 _chainSelector) external override onlyOwner {
		require(destinationChainSelectorToReceiver[_chainSelector] != address(0), "receiver not added");
		delete destinationChainSelectorToReceiver[_chainSelector];
		uint256 length = chainSelectors.length;
		for (uint256 i = 0; i < length; i++) {
			if (chainSelectors[i] == _chainSelector) {
				chainSelectors[i] = chainSelectors[length - 1];
				chainSelectors.pop();
				break;
			}
		}
		emit ReceiverRemoved(_chainSelector);
	}

	/**
	 *  @dev See {IdFactory-getChainSelectors}.
	 */

	function getChainSelectors() external view override returns (uint64[] memory) {
		return chainSelectors;
	}

	/**
	 *  @dev See {IdFactory-getReceiver}.
	 */

	function getReceiver(uint64 _chainSelector) external view override returns (address) {
		return destinationChainSelectorToReceiver[_chainSelector];
	}

	/**
	 *  @dev See {IdFactory-getReceivers}.
	 */

	function getReceivers() external view override returns (address[] memory) {
		address[] memory receivers = new address[](chainSelectors.length);
		for (uint256 i = 0; i < chainSelectors.length; i++) {
			receivers[i] = destinationChainSelectorToReceiver[chainSelectors[i]];
		}
		return receivers;
	}

	/**
	 *  @dev See {IdFactory-getIdentity}.
	 */
	function getIdentity(address _wallet) external view override returns (address) {
		if (_tokenIdentity[_wallet] != address(0)) {
			return _tokenIdentity[_wallet];
		} else {
			return _userIdentity[_wallet];
		}
	}

	/**
	 *  @dev See {IdFactory-isSaltTaken}.
	 */
	function isSaltTaken(string calldata _salt) external view override returns (bool) {
		return _saltTaken[_salt];
	}

	/**
	 *  @dev See {IdFactory-getWallets}.
	 */
	function getWallets(address _identity) external view override returns (address[] memory) {
		return _wallets[_identity];
	}

	/**
	 *  @dev See {IdFactory-getToken}.
	 */
	function getToken(address _identity) external view override returns (address) {
		return _tokenAddress[_identity];
	}

	/**
	 *  @dev See {IdFactory-isTokenFactory}.
	 */
	function isTokenFactory(address _factory) public view override returns (bool) {
		return _tokenFactories[_factory];
	}

	/**
	 *  @dev See {IdFactory-implementationAuthority}.
	 */
	function implementationAuthority() public view override returns (address) {
		return _implementationAuthority;
	}

	/**
	 *
	 * @param _bridge the address of the bridge contract
	 */
	function setBridge(address _bridge) external onlyOwner {
		require(_bridge != address(0), "invalid argument - zero address");
		bridge = _bridge;
	}

	/**
	 *  @dev get bridge address
	 */
	function getBridge() external view returns (address) {
		return bridge;
	}

	// deploy function with create2 opcode call
	// returns the address of the contract created
	function _deploy(string memory salt, bytes memory bytecode) private returns (address) {
		bytes32 saltBytes = bytes32(keccak256(abi.encodePacked(salt)));
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
		emit Deployed(addr);
		return addr;
	}

	// function used to deploy an identity using CREATE2
	function _deployIdentity(
		string memory _salt,
		address implementationAuthority,
		address _wallet
	) private returns (address) {
		bytes memory _code = type(IdentityProxy).creationCode;
		bytes memory _constructData = abi.encode(implementationAuthority, _wallet);
		bytes memory bytecode = abi.encodePacked(_code, _constructData);
		return _deploy(_salt, bytecode);
	}
}
