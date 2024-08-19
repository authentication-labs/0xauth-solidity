"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('Identity', () => {
    it('should revert when attempting to initialize an already deployed identity', async () => {
        const { aliceIdentity, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(aliceIdentity.connect(aliceWallet).initialize(aliceWallet.address)).to.be.revertedWith('Initial key was already setup.');
    });
    it('should revert because interaction with library is forbidden', async () => {
        const { identityImplementation, aliceWallet, deployerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(identityImplementation
            .connect(deployerWallet)
            .addKey(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])), 3, 1)).to.be.revertedWith('Interacting with the library contract is forbidden.');
        await (0, chai_1.expect)(identityImplementation
            .connect(aliceWallet)
            .initialize(deployerWallet.address)).to.be.revertedWith('Initial key was already setup.');
    });
    it('should prevent creating an identity with an invalid initial key', async () => {
        const [identityOwnerWallet] = await hardhat_1.ethers.getSigners();
        const Identity = await hardhat_1.ethers.getContractFactory('Identity');
        await (0, chai_1.expect)(Identity.connect(identityOwnerWallet).deploy(hardhat_1.ethers.ZeroAddress, false, hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
    });
    it('should return the version of the implementation', async () => {
        const { identityImplementation } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        (0, chai_1.expect)(await identityImplementation.version()).to.equal('2.2.1');
    });
});
