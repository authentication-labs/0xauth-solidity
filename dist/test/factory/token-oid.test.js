"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
describe('IdFactory', () => {
    describe('add/remove Token factory', () => {
        it('should manipulate Token factory list', async () => {
            const { identityFactory, deployerWallet, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            await (0, chai_1.expect)(identityFactory.connect(aliceWallet).addTokenFactory(aliceWallet.address)).to.be.revertedWith('Ownable: caller is not the owner');
            await (0, chai_1.expect)(identityFactory.connect(deployerWallet).addTokenFactory(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
            const addTx = await identityFactory.connect(deployerWallet).addTokenFactory(aliceWallet.address);
            await (0, chai_1.expect)(addTx).to.emit(identityFactory, 'TokenFactoryAdded').withArgs(aliceWallet.address);
            await (0, chai_1.expect)(identityFactory.connect(deployerWallet).addTokenFactory(aliceWallet.address)).to.be.revertedWith('already a factory');
            await (0, chai_1.expect)(identityFactory.connect(aliceWallet).removeTokenFactory(bobWallet.address)).to.be.revertedWith('Ownable: caller is not the owner');
            await (0, chai_1.expect)(identityFactory.connect(deployerWallet).removeTokenFactory(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
            await (0, chai_1.expect)(identityFactory.connect(deployerWallet).removeTokenFactory(bobWallet.address)).to.be.revertedWith('not a factory');
            const removeTx = await identityFactory.connect(deployerWallet).removeTokenFactory(aliceWallet.address);
            await (0, chai_1.expect)(removeTx).to.emit(identityFactory, 'TokenFactoryRemoved').withArgs(aliceWallet.address);
        });
    });
    describe('createTokenIdentity', () => {
        it('should revert for being not authorized to deploy token', async () => {
            const { identityFactory, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            await (0, chai_1.expect)(identityFactory
                .connect(aliceWallet)
                .createTokenIdentity(aliceWallet.address, aliceWallet.address, 'TST')).to.be.revertedWith('only Factory or owner can call');
        });
        it('should revert for token address being zero address', async () => {
            const { identityFactory, deployerWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            await (0, chai_1.expect)(identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(hardhat_1.ethers.ZeroAddress, aliceWallet.address, 'TST')).to.be.revertedWith('invalid argument - zero address');
        });
        it('should revert for owner being zero address', async () => {
            const { identityFactory, deployerWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            await (0, chai_1.expect)(identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(aliceWallet.address, hardhat_1.ethers.ZeroAddress, 'TST')).to.be.revertedWith('invalid argument - zero address');
        });
        it('should revert for salt being empty', async () => {
            const { identityFactory, deployerWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            await (0, chai_1.expect)(identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(aliceWallet.address, aliceWallet.address, '')).to.be.revertedWith('invalid argument - empty string');
        });
        it('should create one identity and then revert for salt/address being already used', async () => {
            const { identityFactory, deployerWallet, aliceWallet, bobWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployFactoryFixture);
            (0, chai_1.expect)(await identityFactory.isSaltTaken('Tokensalt1')).to.be.false;
            const tx = await identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(aliceWallet.address, bobWallet.address, 'salt1');
            const tokenIdentityAddress = await identityFactory.getIdentity(aliceWallet.address);
            await (0, chai_1.expect)(tx)
                .to.emit(identityFactory, 'TokenLinked')
                .withArgs(aliceWallet.address, tokenIdentityAddress);
            await (0, chai_1.expect)(tx).to.emit(identityFactory, 'Deployed').withArgs(tokenIdentityAddress);
            (0, chai_1.expect)(await identityFactory.isSaltTaken('Tokensalt1')).to.be.true;
            (0, chai_1.expect)(await identityFactory.isSaltTaken('Tokensalt2')).to.be.false;
            (0, chai_1.expect)(await identityFactory.getToken(tokenIdentityAddress)).to.deep.equal(aliceWallet.address);
            await (0, chai_1.expect)(identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(aliceWallet.address, aliceWallet.address, 'salt1')).to.be.revertedWith('salt already taken');
            await (0, chai_1.expect)(identityFactory
                .connect(deployerWallet)
                .createTokenIdentity(aliceWallet.address, aliceWallet.address, 'salt2')).to.be.revertedWith('token already linked to an identity');
        });
    });
});
