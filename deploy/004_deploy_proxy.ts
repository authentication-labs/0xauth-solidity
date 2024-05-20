import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployerWallet, aliceWallet } = await getNamedAccounts();

    await deploy('IdentityProxy', {
        from: deployerWallet,
        args: ["0x4822CF27eE43aFc6499225E91428F4696647B3a6", "0xD4009CBc79B67155f101924AeB398BEb038d428C"],
        log: true,
        autoMine: true,
    });
};
export default func;
func.tags = ['IdentityProxy'];
