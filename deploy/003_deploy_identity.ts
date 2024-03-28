import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployerWallet, aliceWallet } = await getNamedAccounts();

    await deploy('Identity', {
        from: deployerWallet,
        args: [aliceWallet, false],
        log: true,
        autoMine: true,
    });
};
export default func;
func.tags = ['Identity'];
