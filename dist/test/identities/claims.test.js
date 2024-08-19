"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('Identity', () => {
    describe('Claims', () => {
        describe('addClaim', () => {
            describe('when the claim is self-attested (issuer is identity address)', () => {
                describe('when the claim is not valid', () => {
                    it('should add the claim anyway', async () => {
                        const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                        const claim = {
                            identity: await aliceIdentity.getAddress(),
                            issuer: await aliceIdentity.getAddress(),
                            topic: 42,
                            scheme: 1,
                            data: '0x0042',
                            signature: '',
                            uri: 'https://example.com',
                        };
                        claim.signature = await aliceWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, '0x101010']))));
                        const tx = await aliceIdentity
                            .connect(aliceWallet)
                            .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                        await (0, chai_1.expect)(tx)
                            .to.emit(aliceIdentity, 'ClaimAdded')
                            .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                        await (0, chai_1.expect)(aliceIdentity.isClaimValid(claim.identity, claim.topic, claim.signature, claim.data)).to.eventually.equal(false);
                    });
                });
                describe('when the claim is valid', () => {
                    let claim = { identity: '', issuer: '', topic: 0, scheme: 1, data: '', uri: '', signature: '' };
                    before(async () => {
                        const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                        claim = {
                            identity: await aliceIdentity.getAddress(),
                            issuer: await aliceIdentity.getAddress(),
                            topic: 42,
                            scheme: 1,
                            data: '0x0042',
                            signature: '',
                            uri: 'https://example.com',
                        };
                        claim.signature = await aliceWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    });
                    describe('when caller is the identity itself (execute)', () => {
                        it('should add the claim', async () => {
                            const { aliceIdentity, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                            const action = {
                                to: await aliceIdentity.getAddress(),
                                value: 0,
                                data: new hardhat_1.ethers.Interface([
                                    'function addClaim(uint256 topic, uint256 scheme, address issuer, bytes calldata signature, bytes calldata data, string calldata uri) external returns (bytes32 claimRequestId)',
                                ]).encodeFunctionData('addClaim', [
                                    claim.topic,
                                    claim.scheme,
                                    claim.issuer,
                                    claim.signature,
                                    claim.data,
                                    claim.uri,
                                ]),
                            };
                            await aliceIdentity.connect(bobWallet).execute(action.to, action.value, action.data);
                            const tx = await aliceIdentity.connect(aliceWallet).approve(0, true);
                            await (0, chai_1.expect)(tx)
                                .to.emit(aliceIdentity, 'ClaimAdded')
                                .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                            await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                            await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                            await (0, chai_1.expect)(aliceIdentity.isClaimValid(claim.identity, claim.topic, claim.signature, claim.data)).to.eventually.equal(true);
                        });
                    });
                    describe('when caller is a CLAIM or MANAGEMENT key', () => {
                        it('should add the claim', async () => {
                            it('should add the claim anyway', async () => {
                                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                                const tx = await aliceIdentity
                                    .connect(aliceWallet)
                                    .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                                await (0, chai_1.expect)(tx)
                                    .to.emit(aliceIdentity, 'ClaimAdded')
                                    .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                            });
                        });
                    });
                    describe('when caller is not a CLAIM key', () => {
                        it('should revert for missing permission', async () => {
                            const { aliceIdentity, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                            await (0, chai_1.expect)(aliceIdentity
                                .connect(bobWallet)
                                .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri)).to.be.revertedWith('Permissions: Sender does not have claim signer key');
                        });
                    });
                });
            });
            describe('when the claim is from a claim issuer', () => {
                describe('when the claim is not valid', () => {
                    it('should revert for invalid claim', async () => {
                        const { aliceIdentity, aliceWallet, claimIssuerWallet, claimIssuer } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                        const claim = {
                            identity: await aliceIdentity.getAddress(),
                            issuer: await claimIssuer.getAddress(),
                            topic: 42,
                            scheme: 1,
                            data: '0x0042',
                            signature: '',
                            uri: 'https://example.com',
                        };
                        claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, '0x10101010']))));
                        await (0, chai_1.expect)(aliceIdentity
                            .connect(aliceWallet)
                            .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri)).to.be.revertedWith('invalid claim');
                    });
                });
                describe('when the claim is valid', () => {
                    let claim = { identity: '', issuer: '', topic: 0, scheme: 1, data: '', uri: '', signature: '' };
                    before(async () => {
                        const { aliceIdentity, claimIssuer, claimIssuerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                        claim = {
                            identity: await aliceIdentity.getAddress(),
                            issuer: await claimIssuer.getAddress(),
                            topic: 42,
                            scheme: 1,
                            data: '0x0042',
                            signature: '',
                            uri: 'https://example.com',
                        };
                        claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    });
                    describe('when caller is the identity itself (execute)', () => {
                        it('should add the claim', async () => {
                            const { aliceIdentity, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                            const action = {
                                to: await aliceIdentity.getAddress(),
                                value: 0,
                                data: new hardhat_1.ethers.Interface([
                                    'function addClaim(uint256 topic, uint256 scheme, address issuer, bytes calldata signature, bytes calldata data, string calldata uri) external returns (bytes32 claimRequestId)',
                                ]).encodeFunctionData('addClaim', [
                                    claim.topic,
                                    claim.scheme,
                                    claim.issuer,
                                    claim.signature,
                                    claim.data,
                                    claim.uri,
                                ]),
                            };
                            await aliceIdentity.connect(bobWallet).execute(action.to, action.value, action.data);
                            const tx = await aliceIdentity.connect(aliceWallet).approve(0, true);
                            await (0, chai_1.expect)(tx)
                                .to.emit(aliceIdentity, 'ClaimAdded')
                                .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                            await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                            await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                        });
                    });
                    describe('when caller is a CLAIM or MANAGEMENT key', () => {
                        it('should add the claim', async () => {
                            it('should add the claim anyway', async () => {
                                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                                const tx = await aliceIdentity
                                    .connect(aliceWallet)
                                    .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                                await (0, chai_1.expect)(tx)
                                    .to.emit(aliceIdentity, 'ClaimAdded')
                                    .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                            });
                        });
                    });
                    describe('when caller is not a CLAIM key', () => {
                        it('should revert for missing permission', async () => {
                            const { aliceIdentity, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                            await (0, chai_1.expect)(aliceIdentity
                                .connect(bobWallet)
                                .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri)).to.be.revertedWith('Permissions: Sender does not have claim signer key');
                        });
                    });
                });
            });
        });
        describe('updateClaim (addClaim)', () => {
            describe('when there is already a claim from this issuer and this topic', () => {
                let aliceIdentity;
                let aliceWallet;
                let claimIssuer;
                let claimIssuerWallet;
                before(async () => {
                    const params = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    aliceIdentity = params.aliceIdentity;
                    aliceWallet = params.aliceWallet;
                    claimIssuer = params.claimIssuer;
                    claimIssuerWallet = params.claimIssuerWallet;
                    const claim = {
                        identity: await aliceIdentity.getAddress(),
                        issuer: await claimIssuer.getAddress(),
                        topic: 42,
                        scheme: 1,
                        data: '0x0042',
                        signature: '',
                        uri: 'https://example.com',
                    };
                    claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    await aliceIdentity
                        .connect(aliceWallet)
                        .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                });
                it('should replace the existing claim', async () => {
                    const claim = {
                        identity: await aliceIdentity.getAddress(),
                        issuer: await claimIssuer.getAddress(),
                        topic: 42,
                        scheme: 1,
                        data: '0x004200101010',
                        signature: '',
                        uri: 'https://example.com',
                    };
                    claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    const tx = await aliceIdentity
                        .connect(aliceWallet)
                        .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                    await (0, chai_1.expect)(tx)
                        .to.emit(aliceIdentity, 'ClaimChanged')
                        .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic])), claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                });
            });
        });
        describe('removeClaim', () => {
            describe('When caller is the identity itself (execute)', () => {
                it('should remove an existing claim', async () => {
                    const { aliceIdentity, aliceWallet, bobWallet, claimIssuer, claimIssuerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const claim = {
                        identity: await aliceIdentity.getAddress(),
                        issuer: await claimIssuer.getAddress(),
                        topic: 42,
                        scheme: 1,
                        data: '0x0042',
                        signature: '',
                        uri: 'https://example.com',
                    };
                    const claimId = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic]));
                    claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    await aliceIdentity
                        .connect(aliceWallet)
                        .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                    const action = {
                        to: await aliceIdentity.getAddress(),
                        value: 0,
                        data: new hardhat_1.ethers.Interface([
                            'function removeClaim(bytes32 claimId) external returns (bool success)',
                        ]).encodeFunctionData('removeClaim', [claimId]),
                    };
                    await aliceIdentity.connect(bobWallet).execute(action.to, action.value, action.data);
                    const tx = await aliceIdentity.connect(aliceWallet).approve(0, true);
                    await (0, chai_1.expect)(tx)
                        .to.emit(aliceIdentity, 'ClaimRemoved')
                        .withArgs(claimId, claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                });
            });
            describe('When caller is not a CLAIM key', () => {
                it('should revert for missing permission', async () => {
                    const { aliceIdentity, bobWallet, claimIssuer } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const claimId = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [await claimIssuer.getAddress(), 42]));
                    await (0, chai_1.expect)(aliceIdentity.connect(bobWallet).removeClaim(claimId)).to.be.revertedWith('Permissions: Sender does not have claim signer key');
                });
            });
            describe('When claim does not exist', () => {
                it('should revert for non existing claim', async () => {
                    const { aliceIdentity, carolWallet, claimIssuer } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const claimId = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [await claimIssuer.getAddress(), 42]));
                    await (0, chai_1.expect)(aliceIdentity.connect(carolWallet).removeClaim(claimId)).to.be.revertedWith('NonExisting: There is no claim with this ID');
                });
            });
            describe('When claim does exist', () => {
                it('should remove the claim', async () => {
                    const { aliceIdentity, aliceWallet, claimIssuer, claimIssuerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const claim = {
                        identity: await aliceIdentity.getAddress(),
                        issuer: await claimIssuer.getAddress(),
                        topic: 42,
                        scheme: 1,
                        data: '0x0042',
                        signature: '',
                        uri: 'https://example.com',
                    };
                    const claimId = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [claim.issuer, claim.topic]));
                    claim.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claim.identity, claim.topic, claim.data]))));
                    await aliceIdentity
                        .connect(aliceWallet)
                        .addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                    const tx = await aliceIdentity.connect(aliceWallet).removeClaim(claimId);
                    await (0, chai_1.expect)(tx)
                        .to.emit(aliceIdentity, 'ClaimRemoved')
                        .withArgs(claimId, claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
                });
            });
        });
        describe('getClaim', () => {
            describe('when claim does not exist', () => {
                it('should return an empty struct', async () => {
                    const { aliceIdentity, claimIssuer } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const claimId = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [await claimIssuer.getAddress(), 42]));
                    const found = await aliceIdentity.getClaim(claimId);
                    (0, chai_1.expect)(found.issuer).to.equal(hardhat_1.ethers.ZeroAddress);
                    (0, chai_1.expect)(found.topic).to.equal(0);
                    (0, chai_1.expect)(found.scheme).to.equal(0);
                    (0, chai_1.expect)(found.data).to.equal('0x');
                    (0, chai_1.expect)(found.signature).to.equal('0x');
                    (0, chai_1.expect)(found.uri).to.equal('');
                });
            });
            describe('when claim does exist', () => {
                it('should return the claim', async () => {
                    const { aliceIdentity, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const found = await aliceIdentity.getClaim(aliceClaim666.id);
                    (0, chai_1.expect)(found.issuer).to.equal(aliceClaim666.issuer);
                    (0, chai_1.expect)(found.topic).to.equal(aliceClaim666.topic);
                    (0, chai_1.expect)(found.scheme).to.equal(aliceClaim666.scheme);
                    (0, chai_1.expect)(found.data).to.equal(aliceClaim666.data);
                    (0, chai_1.expect)(found.signature).to.equal(aliceClaim666.signature);
                    (0, chai_1.expect)(found.uri).to.equal(aliceClaim666.uri);
                });
            });
        });
        describe('getClaimIdsByTopic', () => {
            it('should return an empty array when there are no claims for the topic', async () => {
                const { aliceIdentity } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(aliceIdentity.getClaimIdsByTopic(101010)).to.eventually.deep.equal([]);
            });
            it('should return an array of claim Id existing fo the topic', async () => {
                const { aliceIdentity, aliceClaim666 } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(aliceIdentity.getClaimIdsByTopic(aliceClaim666.topic)).to.eventually.deep.equal([
                    aliceClaim666.id,
                ]);
            });
        });
    });
});
