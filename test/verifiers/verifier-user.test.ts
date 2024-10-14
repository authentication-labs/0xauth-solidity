import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployIdentityFixture } from '../fixtures';

describe('VerifierUser', () => {
	describe('when calling a verified function not as an identity', () => {
		it('should revert', async () => {
			const verifierUser = await ethers.deployContract('VerifierUser', []);

			await verifierUser.addClaimTopic(666);

			await expect(verifierUser.doSomething()).to.be.reverted;
		});
	});


	describe('when identity is verified', () => {
		it('should return', async () => {
			const [deployer, aliceWallet, claimIssuerWallet] = await ethers.getSigners();
			const { claimIssuer, aliceIdentity, aliceClaim666 } = await loadFixture(deployIdentityFixture);
	
			const VerifierUser = await ethers.getContractFactory('VerifierUser');
			const verifierUser = await VerifierUser.connect(deployer).deploy();
	
			await verifierUser.connect(deployer).addClaimTopic(666);
			await verifierUser.addTrustedIssuer(await claimIssuer.getAddress(), [666]);
	
			await aliceIdentity
				.connect(aliceWallet)
				.addClaim(
					aliceClaim666.topic,
					aliceClaim666.scheme,
					aliceClaim666.issuer,
					aliceClaim666.signature,
					aliceClaim666.data,
					aliceClaim666.uri
				);
	
			// Ensure aliceWallet has the management key
			const aliceManagementKeyHash = ethers.keccak256(
				ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])
			);
			await aliceIdentity.connect(aliceWallet).addKey(aliceManagementKeyHash, 1, 1);
	
			// Ensure aliceWallet has the claim signer key
			const aliceClaimSignerKeyHash = ethers.keccak256(
				ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])
			);
			await aliceIdentity.connect(aliceWallet).addKey(aliceClaimSignerKeyHash, 3, 1);
	
			const action = {
				to: await verifierUser.getAddress(),
				value: 0,
				data: new ethers.Interface(['function doSomething()']).encodeFunctionData('doSomething'),
			};
	
			const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
			expect(tx).to.emit(aliceIdentity, 'Executed');
		});
	});

	describe('when identity is not verified', () => {
		it('should revert', async () => {
			const [deployer, aliceWallet, claimIssuerWallet] = await ethers.getSigners();
			const { claimIssuer, aliceIdentity, aliceClaim666 } = await loadFixture(deployIdentityFixture);
	
			const VerifierUser = await ethers.getContractFactory('VerifierUser');
			const verifierUser = await VerifierUser.connect(deployer).deploy();
	
			await verifierUser.connect(deployer).addClaimTopic(666);
			await verifierUser.addTrustedIssuer(await claimIssuer.getAddress(), [666]);

			aliceClaim666.signature = await claimIssuerWallet.signMessage(
				ethers.getBytes(
					ethers.keccak256(
						ethers.AbiCoder.defaultAbiCoder().encode(
							['address', 'uint256', 'bytes'],
							[aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]
						)
					)
				)
			);
			await aliceIdentity
				.connect(aliceWallet)
				.addClaim(
					aliceClaim666.topic,
					aliceClaim666.scheme,
					aliceClaim666.issuer,
					aliceClaim666.signature,
					aliceClaim666.data,
					aliceClaim666.uri
				);

			await claimIssuer.connect(claimIssuerWallet).revokeClaimBySignature(aliceClaim666.signature);

			const action = {
				to: await verifierUser.getAddress(),
				value: 0,
				data: new ethers.Interface(['function doSomething()']).encodeFunctionData('doSomething'),
			};

			const tx = await aliceIdentity.connect(aliceWallet).execute(action.to, action.value, action.data);
			expect(tx).to.emit(aliceIdentity, 'ExecutionFailed');
		});
	});
});
