"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const hardhat_1 = require("hardhat");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const fixtures_1 = require("../fixtures");
chai_1.default.use(chai_as_promised_1.default);
describe('IdFactory', () => {
    it('should revert because authority is Zero address', async () => {
        const [deployerWallet] = await hardhat_1.ethers.getSigners();
        const IdFactory = await hardhat_1.ethers.getContractFactory('IdFactory');
        await (0, chai_1.expect)(IdFactory.connect(deployerWallet).deploy(hardhat_1.ethers.ZeroAddress, true)).to.be.revertedWith('invalid argument - zero address');
    });
    it('should revert because sender is not allowed to create identities', async () => {
        const { identityFactory, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(identityFactory
            .connect(aliceWallet)
            .createIdentity(hardhat_1.ethers.ZeroAddress, 'salt1')).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('should revert because wallet of identity cannot be Zero address', async () => {
        const { identityFactory, deployerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(identityFactory
            .connect(deployerWallet)
            .createIdentity(hardhat_1.ethers.ZeroAddress, 'salt1')).to.be.revertedWith('invalid argument - zero address');
    });
    it('should revert because salt cannot be empty', async () => {
        const { identityFactory, deployerWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(identityFactory
            .connect(deployerWallet)
            .createIdentity(davidWallet.address, '')).to.be.revertedWith('invalid argument - empty string');
    });
    it('should revert because salt cannot be already used', async () => {
        const { identityFactory, deployerWallet, davidWallet, carolWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await identityFactory
            .connect(deployerWallet)
            .createIdentity(carolWallet.address, 'saltUsed');
        await (0, chai_1.expect)(identityFactory
            .connect(deployerWallet)
            .createIdentity(davidWallet.address, 'saltUsed')).to.be.revertedWith('salt already taken');
    });
    it('should revert because wallet is already linked to an identity', async () => {
        const { identityFactory, deployerWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(identityFactory
            .connect(deployerWallet)
            .createIdentity(aliceWallet.address, 'newSalt')).to.be.revertedWith('wallet already linked to an identity');
    });
    describe('link/unlink wallet', () => {
        describe('linkWallet', () => {
            it('should revert for new wallet being zero address', async () => {
                const { identityFactory, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory.connect(aliceWallet).linkWallet(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
            });
            it('should revert for sender wallet being not linked', async () => {
                const { identityFactory, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory.connect(davidWallet).linkWallet(davidWallet.address)).to.be.revertedWith('wallet not linked to an identity contract');
            });
            it('should revert for new wallet being already linked', async () => {
                const { identityFactory, bobWallet, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory.connect(bobWallet).linkWallet(aliceWallet.address)).to.be.revertedWith('new wallet already linked');
            });
            it('should revert for new wallet being already to a token identity', async () => {
                const { identityFactory, bobWallet, tokenAddress } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory.connect(bobWallet).linkWallet(tokenAddress)).to.be.revertedWith('invalid argument - token address');
            });
            it('should link the new wallet to the existing identity', async () => {
                const { identityFactory, aliceIdentity, aliceWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const tx = await identityFactory
                    .connect(aliceWallet)
                    .linkWallet(davidWallet.address);
                await (0, chai_1.expect)(tx)
                    .to.emit(identityFactory, 'WalletLinked')
                    .withArgs(davidWallet.address, await aliceIdentity.getAddress());
                (0, chai_1.expect)(await identityFactory.getWallets(await aliceIdentity.getAddress())).to.deep.equal([aliceWallet.address, davidWallet.address]);
            });
        });
        describe('unlinkWallet', () => {
            it('should revert for wallet to unlink being zero address', async () => {
                const { identityFactory, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory.connect(aliceWallet).unlinkWallet(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
            });
            it('should revert for sender wallet attemoting to unlink itself', async () => {
                const { identityFactory, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory
                    .connect(aliceWallet)
                    .unlinkWallet(aliceWallet.address)).to.be.revertedWith('cannot be called on sender address');
            });
            it('should revert for sender wallet being not linked', async () => {
                const { identityFactory, aliceWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory
                    .connect(davidWallet)
                    .unlinkWallet(aliceWallet.address)).to.be.revertedWith('only a linked wallet can unlink');
            });
            it('should unlink the wallet', async () => {
                const { identityFactory, aliceIdentity, aliceWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await identityFactory
                    .connect(aliceWallet)
                    .linkWallet(davidWallet.address);
                const tx = await identityFactory
                    .connect(aliceWallet)
                    .unlinkWallet(davidWallet.address);
                await (0, chai_1.expect)(tx)
                    .to.emit(identityFactory, 'WalletUnlinked')
                    .withArgs(davidWallet.address, await aliceIdentity.getAddress());
                (0, chai_1.expect)(await identityFactory.getWallets(await aliceIdentity.getAddress())).to.deep.equal([aliceWallet.address]);
            });
        });
    });
    describe('createIdentityWithManagementKeys()', () => {
        describe('when no management keys are provided', () => {
            it('should revert', async () => {
                const { identityFactory, deployerWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory
                    .connect(deployerWallet)
                    .createIdentityWithManagementKeys(davidWallet.address, 'salt1', [])).to.be.revertedWith('invalid argument - empty list of keys');
            });
        });
        describe('when the wallet is included in the management keys listed', () => {
            it('should revert', async () => {
                const { identityFactory, deployerWallet, aliceWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                await (0, chai_1.expect)(identityFactory
                    .connect(deployerWallet)
                    .createIdentityWithManagementKeys(davidWallet.address, 'salt1', [
                    hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])),
                    hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [davidWallet.address])),
                ])).to.be.revertedWith('invalid argument - wallet is also listed in management keys');
            });
        });
        describe('when other management keys are specified', () => {
            it('should deploy the identity proxy, set keys and wallet as management, and link wallet to identity', async () => {
                const { identityFactory, deployerWallet, aliceWallet, davidWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
                const tx = await identityFactory
                    .connect(deployerWallet)
                    .createIdentityWithManagementKeys(davidWallet.address, 'salt1', [
                    hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])),
                ]);
                await (0, chai_1.expect)(tx).to.emit(identityFactory, 'WalletLinked');
                await (0, chai_1.expect)(tx).to.emit(identityFactory, 'Deployed');
                const identity = await hardhat_1.ethers.getContractAt('Identity', await identityFactory.getIdentity(davidWallet.address));
                await (0, chai_1.expect)(tx)
                    .to.emit(identity, 'KeyAdded')
                    .withArgs(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])), 1, 1);
                await (0, chai_1.expect)(identity.keyHasPurpose(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [await identityFactory.getAddress()]), 1)).to.eventually.be.false;
                await (0, chai_1.expect)(identity.keyHasPurpose(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [davidWallet.address]), 1)).to.eventually.be.false;
                await (0, chai_1.expect)(identity.keyHasPurpose(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address]), 1)).to.eventually.be.false;
            });
        });
    });
});
