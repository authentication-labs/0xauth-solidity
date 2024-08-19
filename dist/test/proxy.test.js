"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const fixtures_1 = require("./fixtures");
describe('Proxy', () => {
    it('should revert because implementation is Zero address', async () => {
        const [deployerWallet, identityOwnerWallet] = await hardhat_1.ethers.getSigners();
        const IdentityProxy = await hardhat_1.ethers.getContractFactory('IdentityProxy');
        await (0, chai_1.expect)(IdentityProxy.connect(deployerWallet).deploy(hardhat_1.ethers.ZeroAddress, identityOwnerWallet.address)).to.be.revertedWith('invalid argument - zero address');
    });
    it('should revert because implementation is not an identity', async () => {
        const [deployerWallet, identityOwnerWallet] = await hardhat_1.ethers.getSigners();
        const claimIssuer = await hardhat_1.ethers.deployContract('Test');
        claimIssuer.waitForDeployment();
        const authority = await hardhat_1.ethers.deployContract('ImplementationAuthority', [
            await claimIssuer.getAddress(),
        ]);
        const IdentityProxy = await hardhat_1.ethers.getContractFactory('IdentityProxy');
        await (0, chai_1.expect)(IdentityProxy.connect(deployerWallet).deploy(await authority.getAddress(), identityOwnerWallet.address)).to.be.revertedWith('Initialization failed.');
    });
    it('should revert because initial key is Zero address', async () => {
        const [deployerWallet] = await hardhat_1.ethers.getSigners();
        const implementation = await hardhat_1.ethers.deployContract('Identity', [
            deployerWallet.address,
            true,
        ]);
        const implementationAuthority = await hardhat_1.ethers.deployContract('ImplementationAuthority', [await implementation.getAddress()]);
        const IdentityProxy = await hardhat_1.ethers.getContractFactory('IdentityProxy');
        await (0, chai_1.expect)(IdentityProxy.connect(deployerWallet).deploy(await implementationAuthority.getAddress(), hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
    });
    // NOTICE : This is commented because ImplementationAddress was removed from constructor in contract
    // it('should prevent creating an implementation authority with a zero address implementation', async () => {
    // 	const [deployerWallet] = await ethers.getSigners();
    // 	const ImplementationAuthority = await ethers.getContractFactory('ImplementationAuthority');
    // 	await expect(
    // 		ImplementationAuthority.connect(deployerWallet).deploy(ethers.ZeroAddress)
    // 	).to.be.revertedWith('invalid argument - zero address');
    // });
    it('should prevent updating to a Zero address implementation', async () => {
        const { implementationAuthority, deployerWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(implementationAuthority
            .connect(deployerWallet)
            .updateImplementation(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('invalid argument - zero address');
    });
    it('should prevent updating when not owner', async () => {
        const { implementationAuthority, aliceWallet } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployIdentityFixture);
        await (0, chai_1.expect)(implementationAuthority
            .connect(aliceWallet)
            .updateImplementation(hardhat_1.ethers.ZeroAddress)).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('should update the implementation address', async () => {
        const [deployerWallet] = await hardhat_1.ethers.getSigners();
        const implementation = await hardhat_1.ethers.deployContract('Identity', [
            deployerWallet.address,
            true,
        ]);
        const implementationAuthority = await hardhat_1.ethers.deployContract('ImplementationAuthority', [await implementation.getAddress()]);
        const newImplementation = await hardhat_1.ethers.deployContract('Identity', [
            deployerWallet.address,
            true,
        ]);
        const tx = await implementationAuthority
            .connect(deployerWallet)
            .updateImplementation(await newImplementation.getAddress());
        await (0, chai_1.expect)(tx)
            .to.emit(implementationAuthority, 'UpdatedImplementation')
            .withArgs(await newImplementation.getAddress());
    });
});
