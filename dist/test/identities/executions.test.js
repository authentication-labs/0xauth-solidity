"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('Identity', () => {
    describe('Execute', () => {
        describe('when calling execute as a MANAGEMENT key', () => {
            describe('when execution is possible (transferring value with enough funds on the identity)', () => {
                it('should execute immediately the action', async () => {
                    const { aliceIdentity, aliceWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const previousBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                    const action = {
                        to: carolWallet.address,
                        value: 10,
                        data: '0x',
                    };
                    const tx = await aliceIdentity
                        .connect(aliceWallet)
                        .execute(action.to, action.value, action.data, { value: action.value });
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                    const newBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                    (0, chai_1.expect)(newBalance).to.equal(previousBalance + BigInt(action.value));
                });
            });
            describe('when execution is possible (successfull call)', () => {
                it('should emit Executed', async () => {
                    const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    const action = {
                        to: await aliceIdentity.getAddress(),
                        value: 0,
                        data: new hardhat_1.ethers.Interface([
                            'function addKey(bytes32 key, uint256 purpose, uint256 keyType) returns (bool success)',
                        ]).encodeFunctionData('addKey', [aliceKeyHash, 3, 1]),
                    };
                    const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                    const purposes = await aliceIdentity.getKeyPurposes(aliceKeyHash);
                    (0, chai_1.expect)(purposes).to.deep.equal([1, 3]);
                });
            });
            describe('when execution is not possible (failing call)', () => {
                it('should emit an ExecutionFailed event', async () => {
                    const { aliceIdentity, aliceWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const previousBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                    const action = {
                        to: await aliceIdentity.getAddress(),
                        value: 0,
                        data: new hardhat_1.ethers.Interface([
                            'function addKey(bytes32 key, uint256 purpose, uint256 keyType) returns (bool success)',
                        ]).encodeFunctionData('addKey', [
                            hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])),
                            1,
                            1,
                        ]),
                    };
                    const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'ExecutionFailed');
                    const newBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                    (0, chai_1.expect)(newBalance).to.equal(previousBalance + BigInt(action.value));
                });
            });
        });
        describe('when calling execute as an ACTION key', () => {
            describe('when target is the identity contract', () => {
                it('should create an execution request', async () => {
                    const { aliceIdentity, aliceWallet, bobWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    const carolKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [carolWallet.address]));
                    await aliceIdentity.connect(aliceWallet).addKey(carolKeyHash, 2, 1);
                    const action = {
                        to: await aliceIdentity.getAddress(),
                        value: 0,
                        data: new hardhat_1.ethers.Interface([
                            'function addKey(bytes32 key, uint256 purpose, uint256 keyType) returns (bool success)',
                        ]).encodeFunctionData('addKey', [aliceKeyHash, 2, 1]),
                    };
                    const tx = await aliceIdentity
                        .connect(carolWallet)
                        .execute(action.to, action.value, action.data, { value: action.value });
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'ExecutionRequested');
                });
            });
            describe('when target is another address', () => {
                it('should emit ExecutionFailed for a failed execution', async () => {
                    const { aliceIdentity, aliceWallet, carolWallet, davidWallet, bobIdentity } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const carolKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [carolWallet.address]));
                    await aliceIdentity.connect(aliceWallet).addKey(carolKeyHash, 2, 1);
                    const aliceKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]));
                    const action = {
                        to: await bobIdentity.getAddress(),
                        value: 10,
                        data: new hardhat_1.ethers.Interface([
                            'function addKey(bytes32 key, uint256 purpose, uint256 keyType) returns (bool success)',
                        ]).encodeFunctionData('addKey', [aliceKeyHash, 3, 1]),
                    };
                    const previousBalance = await hardhat_1.ethers.provider.getBalance(await bobIdentity.getAddress());
                    const tx = await aliceIdentity
                        .connect(carolWallet)
                        .execute(action.to, action.value, action.data, { value: action.value });
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'ExecutionFailed');
                    const newBalance = await hardhat_1.ethers.provider.getBalance(await bobIdentity.getAddress());
                    (0, chai_1.expect)(newBalance).to.equal(previousBalance);
                });
                it('should execute immediately the action', async () => {
                    const { aliceIdentity, aliceWallet, carolWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                    const carolKeyHash = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [carolWallet.address]));
                    await aliceIdentity.connect(aliceWallet).addKey(carolKeyHash, 2, 1);
                    const previousBalance = await hardhat_1.ethers.provider.getBalance(davidWallet.address);
                    const action = {
                        to: davidWallet.address,
                        value: 10,
                        data: '0x',
                    };
                    const tx = await aliceIdentity
                        .connect(carolWallet)
                        .execute(action.to, action.value, action.data, { value: action.value });
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                    await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                    const newBalance = await hardhat_1.ethers.provider.getBalance(davidWallet.address);
                    (0, chai_1.expect)(newBalance).to.equal(previousBalance + BigInt(action.value));
                });
            });
        });
        describe('when calling execute as a non-action key', () => {
            it('should create a pending execution request', async () => {
                const { aliceIdentity, bobWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const previousBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                const action = {
                    to: carolWallet.address,
                    value: 10,
                    data: '0x',
                };
                const tx = await aliceIdentity
                    .connect(bobWallet)
                    .execute(action.to, action.value, action.data, { value: action.value });
                await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'ExecutionRequested');
                const newBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                (0, chai_1.expect)(newBalance).to.equal(previousBalance);
            });
        });
    });
    describe('Approve', () => {
        describe('when calling a non-existing execution request', () => {
            it('should revert for execution request not found', async () => {
                const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).approve(2, true)).to.be.revertedWith('Cannot approve a non-existing execution');
            });
        });
        describe('when calling an already executed request', () => {
            it('should revert for execution request already executed', async () => {
                const { aliceIdentity, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await aliceIdentity.connect(aliceWallet).execute(bobWallet.address, 10, '0x', { value: 10 });
                await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).approve(0, true)).to.be.revertedWith('Request already executed');
            });
        });
        describe('when calling approve for an execution targeting another address as a non-action key', () => {
            it('should revert for not authorized', async () => {
                const { aliceIdentity, bobWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await aliceIdentity.connect(bobWallet).execute(carolWallet.address, 10, '0x', { value: 10 });
                await (0, chai_1.expect)(aliceIdentity.connect(bobWallet).approve(0, true)).to.be.revertedWith('Sender does not have action key');
            });
        });
        describe('when calling approve for an execution targeting another address as a non-management key', () => {
            it('should revert for not authorized', async () => {
                const { aliceIdentity, davidWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await aliceIdentity.connect(bobWallet).execute(await aliceIdentity.getAddress(), 10, '0x', { value: 10 });
                await (0, chai_1.expect)(aliceIdentity.connect(davidWallet).approve(0, true)).to.be.revertedWith('Sender does not have management key');
            });
        });
        describe('when calling approve as a MANAGEMENT key', () => {
            it('should approve the execution request', async () => {
                const { aliceIdentity, aliceWallet, bobWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const previousBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                await aliceIdentity.connect(bobWallet).execute(carolWallet.address, 10, '0x', { value: 10 });
                const tx = await aliceIdentity.connect(aliceWallet).approve(0, true);
                await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Executed');
                const newBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                (0, chai_1.expect)(newBalance).to.equal(previousBalance + BigInt(10));
            });
            it('should leave approve to false', async () => {
                const { aliceIdentity, aliceWallet, bobWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const previousBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                await aliceIdentity.connect(bobWallet).execute(carolWallet.address, 10, '0x', { value: 10 });
                const tx = await aliceIdentity.connect(aliceWallet).approve(0, false);
                await (0, chai_1.expect)(tx).to.emit(aliceIdentity, 'Approved');
                const newBalance = await hardhat_1.ethers.provider.getBalance(carolWallet.address);
                (0, chai_1.expect)(newBalance).to.equal(previousBalance);
            });
        });
    });
});
