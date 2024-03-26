import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;

	const {deployer, identityOwner} = await getNamedAccounts();

	await deploy('ClaimIssuer', {
		from: deployer,
		args: [identityOwner],
		log: true,
		autoMine: true,
	});
};
export default func;
func.tags = ['ClaimIssuer'];
