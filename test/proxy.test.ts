import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployIdentityFixture } from './fixtures';
import { ZeroAddress } from 'ethers';

describe('Proxy', () => {
  it('should revert because implementation is Zero address', async () => {
    const [deployerWallet, identityOwnerWallet] = await ethers.getSigners();

    const IdentityProxy = await ethers.getContractFactory('IdentityProxy');
    await expect(
      IdentityProxy.connect(deployerWallet).deploy(
        ethers.ZeroAddress,
        identityOwnerWallet.address,
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith('invalid argument - zero address');
  });

  it('should revert because implementation is not an identity', async () => {
    const [deployerWallet, identityOwnerWallet] = await ethers.getSigners();
    const { identityFactory } = await loadFixture(
      deployIdentityFixture,
    );

    const claimIssuer = await ethers.deployContract('Test');

    claimIssuer.waitForDeployment();

    const authority = await ethers.deployContract('ImplementationAuthority', []);

    const IdentityProxy = await ethers.getContractFactory('IdentityProxy');
    await expect(
      IdentityProxy.connect(deployerWallet).deploy(
        await authority.getAddress(),
        identityOwnerWallet.address,
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith('Initialization failed.');
  });

  it('should revert because initial key is Zero address', async () => {
    const [deployerWallet] = await ethers.getSigners();
    const { implementationAuthority } = await loadFixture(
      deployIdentityFixture,
    );

    const IdentityProxy = await ethers.getContractFactory('IdentityProxy');
    await expect(
      IdentityProxy.connect(deployerWallet).deploy(
        await implementationAuthority.getAddress(),
        ethers.ZeroAddress,
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWith('invalid argument - zero address');
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
    const { implementationAuthority, deployerWallet } = await loadFixture(
      deployIdentityFixture,
    );

    await expect(
      implementationAuthority
        .connect(deployerWallet)
        .updateImplementation(ethers.ZeroAddress),
    ).to.be.revertedWith('invalid argument - zero address');
  });

  it('should prevent updating when not owner', async () => {
    const { implementationAuthority, aliceWallet } = await loadFixture(
      deployIdentityFixture,
    );

    await expect(
      implementationAuthority
        .connect(aliceWallet)
        .updateImplementation(ethers.ZeroAddress),
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should update the implementation address', async () => {
    const [deployerWallet] = await ethers.getSigners();
    const { implementationAuthority, identityImplementation } = await loadFixture(
      deployIdentityFixture,
    );
    
    const tx = await implementationAuthority
      .connect(deployerWallet)
      .updateImplementation(await identityImplementation.getAddress());
    await expect(tx)
      .to.emit(implementationAuthority, 'UpdatedImplementation')
      .withArgs(await identityImplementation.getAddress());
  });
});
