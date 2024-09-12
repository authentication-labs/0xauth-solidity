"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
describe('VerifierUser', () => {
    describe('when calling a verified function not as an identity', () => {
        it('should revert', async () => {
            const verifierUser = await hardhat_1.ethers.deployContract('VerifierUser', []);
            await verifierUser.addClaimTopic(666);
            await (0, chai_1.expect)(verifierUser.doSomething()).to.be.reverted;
        });
    });
    describe('when identity is verified', () => {
        it('should return', async () => {
            const [deployer, aliceWallet, claimIssuerWallet] = await hardhat_1.ethers.getSigners();
            const claimIssuer = await hardhat_1.ethers.deployContract('ClaimIssuer', [claimIssuerWallet.address]);
            const aliceIdentity = await hardhat_1.ethers.deployContract('Identity', [aliceWallet.address, false]);
            const verifierUser = await hardhat_1.ethers.deployContract('VerifierUser', []);
            await verifierUser.addClaimTopic(666);
            await verifierUser.addTrustedIssuer(await claimIssuer.getAddress(), [666]);
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
            aliceClaim666.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]))));
            await aliceIdentity
                .connect(aliceWallet)
                .addClaim(aliceClaim666.topic, aliceClaim666.scheme, aliceClaim666.issuer, aliceClaim666.signature, aliceClaim666.data, aliceClaim666.uri);
            const action = {
                to: await verifierUser.getAddress(),
                value: 0,
                data: new hardhat_1.ethers.Interface(['function doSomething()']).encodeFunctionData('doSomething'),
            };
            const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
            (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
        });
    });
    describe('when identity is not verified', () => {
        it('should revert', async () => {
            const [deployer, aliceWallet, claimIssuerWallet] = await hardhat_1.ethers.getSigners();
            const claimIssuer = await hardhat_1.ethers.deployContract('ClaimIssuer', [claimIssuerWallet.address]);
            const aliceIdentity = await hardhat_1.ethers.deployContract('Identity', [aliceWallet.address, false]);
            const verifierUser = await hardhat_1.ethers.deployContract('VerifierUser', []);
            await verifierUser.addClaimTopic(666);
            await verifierUser.addTrustedIssuer(await claimIssuer.getAddress(), [666]);
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
            aliceClaim666.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]))));
            await aliceIdentity
                .connect(aliceWallet)
                .addClaim(aliceClaim666.topic, aliceClaim666.scheme, aliceClaim666.issuer, aliceClaim666.signature, aliceClaim666.data, aliceClaim666.uri);
            await claimIssuer.connect(claimIssuerWallet).revokeClaimBySignature(aliceClaim666.signature);
            const action = {
                to: await verifierUser.getAddress(),
                value: 0,
                data: new hardhat_1.ethers.Interface(['function doSomething()']).encodeFunctionData('doSomething'),
            };
            const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
            (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'ExecutionFailed');
        });
    });
});
