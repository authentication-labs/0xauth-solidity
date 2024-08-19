// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '../factory/IdFactory.sol';
// import '../bridge/Bridge.sol';

using ECDSA for bytes32;

/// A required parameter was set to the Zero address.
error ZeroAddress();
/// The maximum number of signers was reached at deployment.
error TooManySigners();
/// The signed attempted to add was already approved.
error SignerAlreadyApproved(address signer);
/// The signed attempted to remove was not approved.
error SignerAlreadyNotApproved(address signer);
/// A requested ONCHAINID deployment was requested without a valid signature while the Gateway requires one.
error UnsignedDeployment();
/// A requested ONCHAINID deployment was requested and signer by a non approved signer.
error UnapprovedSigner(address signer);
/// A requested ONCHAINID deployment was requested with a signature revoked.
error RevokedSignature(bytes signature);
/// A requested ONCHAINID deployment was requested with a signature that expired.
error ExpiredSignature(bytes signature);
/// Attempted to revoke a signature that was already revoked.
error SignatureAlreadyRevoked(bytes signature);
/// Attempted to approve a signature that was not revoked.
error SignatureNotRevoked(bytes signature);

contract Gateway is Ownable {
  IdFactory public idFactory;
  mapping(address => bool) public approvedSigners;
  mapping(bytes => bool) public revokedSignatures;

  event SignerApproved(address indexed signer);
  event SignerRevoked(address indexed signer);
  event SignatureRevoked(bytes indexed signature);
  event SignatureApproved(bytes indexed signature);

  /**
   *  @dev Constructor for the ONCHAINID Factory Gateway.
   *  @param idFactoryAddress the address of the factory to operate (the Gateway must be owner of the Factory).
   */
  constructor(address idFactoryAddress, address[] memory signersToApprove) Ownable() {
    if (idFactoryAddress == address(0)) {
      revert ZeroAddress();
    }
    if (signersToApprove.length > 10) {
      revert TooManySigners();
    }

    for (uint i = 0; i < signersToApprove.length; i++) {
      approvedSigners[signersToApprove[i]] = true;
    }

    idFactory = IdFactory(idFactoryAddress);
  }

  /**
   *  @dev Approve a signer to sign ONCHAINID deployments. If the Gateway is setup to require signature, only
   *  deployments requested with a valid signature from an approved signer will be accepted.
   *  If the gateway does not require a signature,
   *  @param signer the signer address to approve.
   */
  function approveSigner(address signer) external onlyOwner {
    if (signer == address(0)) {
      revert ZeroAddress();
    }

    if (approvedSigners[signer]) {
      revert SignerAlreadyApproved(signer);
    }

    approvedSigners[signer] = true;

    emit SignerApproved(signer);
  }

  /**
   *  @dev Revoke a signer to sign ONCHAINID deployments.
   *  @param signer the signer address to revoke.
   */
  function revokeSigner(address signer) external onlyOwner {
    if (signer == address(0)) {
      revert ZeroAddress();
    }

    if (!approvedSigners[signer]) {
      revert SignerAlreadyNotApproved(signer);
    }

    delete approvedSigners[signer];

    emit SignerRevoked(signer);
  }

  function deployIdentity(
    address identityOwner,
    string memory salt,
    bytes32[] calldata managementKeys
  ) public returns (address) {
    if (managementKeys.length == 0) {
      // return deployIdentityWithSalt(identityOwner, 'REMOVE IN PROD');
      return deployIdentityWithSalt(identityOwner, salt);
    } else {
      return deployIdentityWithSaltAndManagementKeys(identityOwner, salt, managementKeys);
    }
  }

  /**
   *  @dev Deploy an ONCHAINID using a factory. The operation must be signed by
   *  an approved public key. This method allow to deploy an ONCHAINID using a custom salt.
   *  @param identityOwner the address to set as a management key.
   *  @param salt to use for the deployment.
   */
  function deployIdentityWithSalt(address identityOwner, string memory salt) public returns (address) {
    if (identityOwner == address(0)) {
      revert ZeroAddress();
    }

    if (!approvedSigners[msg.sender]) {
      revert UnapprovedSigner(msg.sender);
    }

    return idFactory.createIdentity(identityOwner, salt);
  }

  /**
   *  @dev Deploy an ONCHAINID using a factory. The operation must be signed by
   *  an approved public key. This method allow to deploy an ONCHAINID using a custom salt and a custom list of
   *  management keys. Note that the identity Owner address won't be added as a management keys, if this is desired,
   *  the key hash must be listed in the managementKeys array.
   *  @param identityOwner the address to set as a management key.
   *  @param salt to use for the deployment.
   *  @param managementKeys the list of management keys to add to the ONCHAINID.
   */
  function deployIdentityWithSaltAndManagementKeys(
    address identityOwner,
    string memory salt,
    bytes32[] calldata managementKeys
  ) public returns (address) {
    if (identityOwner == address(0)) {
      revert ZeroAddress();
    }

    if (!approvedSigners[msg.sender]) {
      revert UnapprovedSigner(msg.sender);
    }

    address identity = idFactory.createIdentityWithManagementKeys(identityOwner, salt, managementKeys);

    // bool isHomeChain = idFactory._isHomeChain();

    // if (isHomeChain) {
    //   address bridgeAddress = idFactory.getBridge();
    //   // Explicit conversion to payable address and then to CrossChainBridge
    //   CrossChainBridge bridge = CrossChainBridge(payable(bridgeAddress));
    //   // Get Destination Chain Selectors and their receivers
    //   address[] memory receivers = idFactory.getReceivers();
    //   uint64[] memory chainSelectors = idFactory.getChainSelectors();
    // Send the CreateIdentity message to the bridge
    //   for (uint i = 0; i < receivers.length; i++) {
    //     if (receivers[i] != address(bridge)) {
    //       bridge.sendCreateIdentity(
    //         chainSelectors[i],
    //         receivers[i],
    //         address(this),
    //         identityOwner,
    //         salt,
    //         managementKeys,
    //         signatureExpiry,
    //         signature
    //       );
    //     }
    //   }
    // }

    return identity;
  }

  /**
   *  @dev Deploy an ONCHAINID using a factory using the identityOwner address as salt.
   *  @param identityOwner the address to set as a management key.
   */
  function deployIdentityForWallet(address identityOwner) external returns (address) {
    if (identityOwner == address(0)) {
      revert ZeroAddress();
    }

    return idFactory.createIdentity(identityOwner, Strings.toHexString(identityOwner));
  }

  /**
   *  @dev Revoke a signature, if the signature is used to deploy an ONCHAINID, the deployment would be rejected.
   *  @param signature the signature to revoke.
   */
  function revokeSignature(bytes calldata signature) external onlyOwner {
    if (revokedSignatures[signature]) {
      revert SignatureAlreadyRevoked(signature);
    }

    revokedSignatures[signature] = true;

    emit SignatureRevoked(signature);
  }

  /**
   *  @dev Remove a signature from the revoke list.
   *  @param signature the signature to approve.
   */
  function approveSignature(bytes calldata signature) external onlyOwner {
    if (!revokedSignatures[signature]) {
      revert SignatureNotRevoked(signature);
    }

    delete revokedSignatures[signature];

    emit SignatureApproved(signature);
  }

  /**
   *  @dev Transfer the ownership of the factory to a new owner.
   *  @param newOwner the new owner of the factory.
   */
  function transferFactoryOwnership(address newOwner) external onlyOwner {
    idFactory.transferOwnership(newOwner);
  }

  /**
   *  @dev Call a function on the factory. Only the owner of the Gateway can call this method.
   *  @param data the data to call on the factory.
   */
  function callFactory(bytes memory data) external onlyOwner {
    (bool success, ) = address(idFactory).call(data);
    require(success, 'Gateway: call to factory failed');
  }
}
