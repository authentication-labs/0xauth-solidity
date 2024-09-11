"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('ClaimIssuer - Reference (with revoke)', () => {
    describe('revokeClaim (deprecated)', () => {
        describe('when calling as a non MANAGEMENT key', () => {
            it('should revert for missing permissions', async () => {
                const { claimIssuer, aliceWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(claimIssuer
                    .connect(aliceWallet)
                    .revokeClaim(aliceClaim666.id, aliceClaim666.identity)).to.be.revertedWith('Permissions: Sender does not have management key');
            });
        });
        describe('when calling as a MANAGEMENT key', () => {
            describe('when claim was already revoked', () => {
                it('should revert for conflict', async () => {
                    const { claimIssuer, claimIssuerWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    await claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaim(aliceClaim666.id, aliceClaim666.identity);
                    await (0, chai_1.expect)(claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaim(aliceClaim666.id, aliceClaim666.identity)).to.be.revertedWith('Conflict: Claim already revoked');
                });
            });
            describe('when is not revoked already', () => {
                it('should revoke the claim', async () => {
                    const { claimIssuer, claimIssuerWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    (0, chai_1.expect)(await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data)).to.be.true;
                    const tx = await claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaim(aliceClaim666.id, aliceClaim666.identity);
                    await (0, chai_1.expect)(tx)
                        .to.emit(claimIssuer, 'ClaimRevoked')
                        .withArgs(aliceClaim666.signature);
                    (0, chai_1.expect)(await claimIssuer.isClaimRevoked(aliceClaim666.signature)).to
                        .be.true;
                    (0, chai_1.expect)(await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data)).to.be.false;
                });
            });
        });
    });
    describe('revokeClaimBySignature', () => {
        describe('when calling as a non MANAGEMENT key', () => {
            it('should revert for missing permissions', async () => {
                const { claimIssuer, aliceWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(claimIssuer
                    .connect(aliceWallet)
                    .revokeClaimBySignature(aliceClaim666.signature)).to.be.revertedWith('Permissions: Sender does not have management key');
            });
        });
        describe('when calling as a MANAGEMENT key', () => {
            describe('when claim was already revoked', () => {
                it('should revert for conflict', async () => {
                    const { claimIssuer, claimIssuerWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    await claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaimBySignature(aliceClaim666.signature);
                    await (0, chai_1.expect)(claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaimBySignature(aliceClaim666.signature)).to.be.revertedWith('Conflict: Claim already revoked');
                });
            });
            describe('when is not revoked already', () => {
                it('should revoke the claim', async () => {
                    const { claimIssuer, claimIssuerWallet, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    (0, chai_1.expect)(await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data)).to.be.true;
                    const tx = await claimIssuer
                        .connect(claimIssuerWallet)
                        .revokeClaimBySignature(aliceClaim666.signature);
                    await (0, chai_1.expect)(tx)
                        .to.emit(claimIssuer, 'ClaimRevoked')
                        .withArgs(aliceClaim666.signature);
                    (0, chai_1.expect)(await claimIssuer.isClaimRevoked(aliceClaim666.signature)).to
                        .be.true;
                    (0, chai_1.expect)(await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data)).to.be.false;
                });
            });
        });
    });
    describe('getRecoveredAddress', () => {
        it('should return with a zero address with signature is not of proper length', async () => {
            const { claimIssuer, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
            (0, chai_1.expect)(await claimIssuer.getRecoveredAddress(aliceClaim666.signature + '00', hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [
                aliceClaim666.identity,
                aliceClaim666.topic,
                aliceClaim666.data,
            ]))))).to.be.equal(hardhat_1.ethers.ZeroAddress);
        });
    });
});
