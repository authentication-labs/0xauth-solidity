"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('Identity', () => {
    describe('Key Management', () => {
        describe('Read key methods', () => {
            it('should retrieve an existing key', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                const aliceKey = await aliceIdentity.getKey(aliceKeyHash);
                (0, chai_1.expect)(aliceKey.key).to.equal(aliceKeyHash);
                (0, chai_1.expect)(aliceKey.purposes).to.deep.equal([1]);
                (0, chai_1.expect)(aliceKey.keyType).to.equal(1);
            });
            it('should retrieve existing key purposes', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                const purposes = await aliceIdentity.getKeyPurposes(aliceKeyHash);
                (0, chai_1.expect)(purposes).to.deep.equal([1]);
            });
            it('should retrieve existing keys with given purpose', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                const keys = await aliceIdentity.getKeysByPurpose(1);
                (0, chai_1.expect)(keys).to.deep.equal([aliceKeyHash]);
            });
            it('should return true if a key has a given purpose', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                const hasPurpose = await aliceIdentity.keyHasPurpose(aliceKeyHash, 1);
                (0, chai_1.expect)(hasPurpose).to.equal(true);
            });
            it('should return false if a key has not a given purpose but is a MANAGEMENT key', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                const hasPurpose = await aliceIdentity.keyHasPurpose(aliceKeyHash, 2);
                (0, chai_1.expect)(hasPurpose).to.equal(true);
            });
            it('should return false if a key has not a given purpose', async () => {
                const { aliceIdentity, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const bobKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [bobWallet.address]));
                const hasPurpose = await aliceIdentity.keyHasPurpose(bobKeyHash, 2);
                (0, chai_1.expect)(hasPurpose).to.equal(false);
            });
        });
        describe('Add key methods', () => {
            describe('when calling as a non-MANAGEMENT key', () => {
                it('should revert because the signer is not a MANAGEMENT key', async () => {
                    const { aliceIdentity, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const bobKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [bobWallet.address]));
                    await (0, chai_1.expect)(aliceIdentity.connect(bobWallet).addKey(bobKeyHash, 1, 1)).to.be.revertedWith('Permissions: Sender does not have management key');
                });
            });
            describe('when calling as a MANAGEMENT key', () => {
                it('should add the purpose to the existing key', async () => {
                    const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    await aliceIdentity.connect(aliceWallet).addKey(aliceKeyHash, 2, 1);
                    const aliceKey = await aliceIdentity.getKey(aliceKeyHash);
                    (0, chai_1.expect)(aliceKey.key).to.equal(aliceKeyHash);
                    (0, chai_1.expect)(aliceKey.purposes).to.deep.equal([1, 2]);
                    (0, chai_1.expect)(aliceKey.keyType).to.equal(1);
                });
                it('should add a new key with a purpose', async () => {
                    const { aliceIdentity, bobWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const bobKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [bobWallet.address]));
                    await aliceIdentity.connect(aliceWallet).addKey(bobKeyHash, 1, 1);
                    const bobKey = await aliceIdentity.getKey(bobKeyHash);
                    (0, chai_1.expect)(bobKey.key).to.equal(bobKeyHash);
                    (0, chai_1.expect)(bobKey.purposes).to.deep.equal([1]);
                    (0, chai_1.expect)(bobKey.keyType).to.equal(1);
                });
                it('should revert because key already has the purpose', async () => {
                    const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).addKey(aliceKeyHash, 1, 1)).to.be.revertedWith('Conflict: Key already has purpose');
                });
            });
        });
        describe('Remove key methods', () => {
            describe('when calling as a non-MANAGEMENT key', () => {
                it('should revert because the signer is not a MANAGEMENT key', async () => {
                    const { aliceIdentity, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    await (0, chai_1.expect)(aliceIdentity.connect(bobWallet).removeKey(aliceKeyHash, 1)).to.be.revertedWith('Permissions: Sender does not have management key');
                });
            });
            describe('when calling as a MANAGEMENT key', () => {
                it('should remove the purpose from the existing key', async () => {
                    const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    await aliceIdentity.connect(aliceWallet).removeKey(aliceKeyHash, 1);
                    const aliceKey = await aliceIdentity.getKey(aliceKeyHash);
                    (0, chai_1.expect)(aliceKey.key).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
                    (0, chai_1.expect)(aliceKey.purposes).to.deep.equal([]);
                    (0, chai_1.expect)(aliceKey.keyType).to.equal(0);
                });
                it('should revert because key does not exists', async () => {
                    const { aliceIdentity, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const bobKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [bobWallet.address]));
                    await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).removeKey(bobKeyHash, 2)).to.be.revertedWith("NonExisting: Key isn't registered");
                });
                it('should revert because key does not have the purpose', async () => {
                    const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).removeKey(aliceKeyHash, 2)).to.be.revertedWith("NonExisting: Key doesn't have such purpose");
                });
            });
        });
    });
});
