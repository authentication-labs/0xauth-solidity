import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;

	const {deployer, identityOwner} = await getNamedAccounts();

	await deploy('Identity', {
		from: deployer,
		args: [identityOwner, false],
		log: true,
		autoMine: true,
	});
};
export default func;
func.tags = ['Identity'];
