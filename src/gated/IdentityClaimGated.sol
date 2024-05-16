// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../interface/IIdentity.sol";
import "../factory/IIdFactory.sol";

contract IdentityClaimGated {
    IIdFactory public identityFactory;
    address public claimIssuer;
    address private owner;

    enum Topic {
        BASIC_IDENTITY,
        ACCREDITED_INVESTOR
    }

    mapping(Topic => uint256) public topicToClaim;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(address _identityFactory, address _claimIssuer) {
        identityFactory = IIdFactory(_identityFactory);
        claimIssuer = _claimIssuer;
        owner = msg.sender; 

        topicToClaim[Topic.BASIC_IDENTITY] = 10101000100000;
        topicToClaim[Topic.ACCREDITED_INVESTOR] = 10101000100001;
    }

    function addTopicClaim(Topic topic, uint256 claim) external onlyOwner {
        topicToClaim[topic] = claim;
    }

    function setClaimIssuer(address issuer) external onlyOwner {
        claimIssuer = issuer;
    }

    function setIdentityFactory(address factory) external onlyOwner {
        identityFactory = IIdFactory(factory);
    }

  
    modifier hasValidClaim(Topic requiredTopic) {
        _validateClaim(requiredTopic, claimIssuer);
        _;
    }

    function _validateClaim(Topic requiredTopic, address issuer) private view {
        address identityAddr = identityFactory.getIdentity(msg.sender);
        require(identityAddr != address(0), "Identity contract not set");

        bytes32 claimId = keccak256(abi.encode(issuer, topicToClaim[requiredTopic]));

        (uint256 topic, , , bytes memory signature, bytes memory data, ) = IIdentity(identityAddr).getClaim(claimId);

        bool isValid = IIdentity(identityAddr).isClaimValid(IIdentity(identityAddr), topic, signature, data);
        require(isValid, "Claim is not valid or unauthorized");
    }
}
