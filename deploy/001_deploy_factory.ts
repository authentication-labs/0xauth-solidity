import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log('Deploying contracts...');
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployerWallet } = await getNamedAccounts();

	console.log(`Deploying contracts with the account: ${deployerWallet}`);

	const identityImplementation = await deploy('Identity', {
		from: deployerWallet,
		args: [deployerWallet, true],
		log: true,
	});

	const implementationAuthority = await deploy('ImplementationAuthority', {
		from: deployerWallet,
		args: [identityImplementation.address],
		log: true,
	});

	const factory = await deploy('IdFactory', {
		from: deployerWallet,
		args: [implementationAuthority.address],
		log: true,
	});

	const gateway = await deploy('Gateway', {
		from: deployerWallet,
		args: [factory.address, [deployerWallet]],
		log: true,
	});

	console.log(`Deployed Identity implementation at ${identityImplementation.address}`);
	console.log(`Deployed Implementation Authority at ${implementationAuthority.address}`);
	console.log(`Deployed Factory at ${factory.address}`);
	console.log(`Deployed Gateway at ${gateway.address}`);
};

export default deployContracts;
deployContracts.tags = ['IdFactory', 'ImplementationAuthority', 'Identity', 'Gateway'];