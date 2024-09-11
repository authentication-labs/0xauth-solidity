"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployFactoryFixture = deployFactoryFixture;
exports.deployIdentityFixture = deployIdentityFixture;
exports.deployCcipFixture = deployCcipFixture;
exports.deployVerifierFixture = deployVerifierFixture;
const hardhat_1 = require("hardhat");
async function deployFactoryFixture() {
    const [deployerWallet, claimIssuerWallet, aliceWallet, bobWallet, carolWallet, davidWallet,] = await hardhat_1.ethers.getSigners();
    const ImplementationAuthority = await hardhat_1.ethers.getContractFactory('ImplementationAuthority');
    const implementationAuthority = await ImplementationAuthority.connect(deployerWallet).deploy();
    await implementationAuthority.waitForDeployment();
    const IdentityFactory = await hardhat_1.ethers.getContractFactory('IdFactory');
    const identityFactory = await IdentityFactory.connect(deployerWallet).deploy(await implementationAuthority.getAddress(), 
    // NOTICE : Change it to false where isHomeChain should be false
    true);
    await identityFactory.waitForDeployment();
    const Identity = await hardhat_1.ethers.getContractFactory('Identity');
    const identityImplementation = await Identity.connect(deployerWallet).deploy(deployerWallet.address, true, identityFactory.getAddress());
    await identityImplementation.waitForDeployment();
    const tx_updateImplementation = await implementationAuthority
        .connect(deployerWallet)
        .updateImplementation(identityImplementation.getAddress());
    await tx_updateImplementation.wait();
    return {
        identityFactory,
        identityImplementation,
        implementationAuthority,
        aliceWallet,
        bobWallet,
        carolWallet,
        davidWallet,
        deployerWallet,
        claimIssuerWallet,
    };
}
async function deployIdentityFixture() {
    const [deployerWallet, claimIssuerWallet, aliceWallet, bobWallet, carolWallet, davidWallet, tokenOwnerWallet,] = await hardhat_1.ethers.getSigners();
    const { identityFactory, identityImplementation, implementationAuthority } = await deployFactoryFixture();
    const ClaimIssuer = await hardhat_1.ethers.getContractFactory('ClaimIssuer');
    const claimIssuer = await ClaimIssuer.connect(claimIssuerWallet).deploy(claimIssuerWallet.address, identityFactory.getAddress());
    await claimIssuer
        .connect(claimIssuerWallet)
        .addKey(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [claimIssuerWallet.address])), 3, 1);
    await identityFactory
        .connect(deployerWallet)
        .createIdentity(aliceWallet.address, 'alice');
    const aliceIdentity = await hardhat_1.ethers.getContractAt('Identity', await identityFactory.getIdentity(aliceWallet.address));
    await aliceIdentity
        .connect(aliceWallet)
        .addKey(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [carolWallet.address])), 3, 1);
    await aliceIdentity
        .connect(aliceWallet)
        .addKey(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [davidWallet.address])), 2, 1);
    const aliceClaim666 = {
        id: '',
        identity: await aliceIdentity.getAddress(),
        issuer: await claimIssuer.getAddress(),
        topic: 666,
        scheme: 1,
        data: '0x0042',
        signature: '',
        uri: 'https://example.com',
    };
    aliceClaim666.id = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [aliceClaim666.issuer, aliceClaim666.topic]));
    aliceClaim666.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]))));
    await aliceIdentity
        .connect(aliceWallet)
        .addClaim(aliceClaim666.topic, aliceClaim666.scheme, aliceClaim666.issuer, aliceClaim666.signature, aliceClaim666.data, aliceClaim666.uri);
    await identityFactory
        .connect(deployerWallet)
        .createIdentity(bobWallet.address, 'bob');
    const bobIdentity = await hardhat_1.ethers.getContractAt('Identity', await identityFactory.getIdentity(bobWallet.address));
    const tokenAddress = '0xdEE019486810C7C620f6098EEcacA0244b0fa3fB';
    await identityFactory
        .connect(deployerWallet)
        .createTokenIdentity(tokenAddress, tokenOwnerWallet.address, 'tokenOwner');
    return {
        identityFactory,
        identityImplementation,
        implementationAuthority,
        claimIssuer,
        aliceWallet,
        bobWallet,
        carolWallet,
        davidWallet,
        deployerWallet,
        claimIssuerWallet,
        tokenOwnerWallet,
        aliceIdentity,
        bobIdentity,
        aliceClaim666,
        tokenAddress,
    };
}
async function deployCcipFixture() {
    const [deployerWallet, claimIssuerWallet, aliceWallet, bobWallet, carolWallet, davidWallet,] = await hardhat_1.ethers.getSigners();
    const localSimulatorFactory = await hardhat_1.ethers.getContractFactory('CCIPLocalSimulator');
    const localSimulator = await localSimulatorFactory
        .connect(deployerWallet)
        .deploy();
    const config = await localSimulator.configuration();
    return { localSimulator };
}
async function deployVerifierFixture() { }
