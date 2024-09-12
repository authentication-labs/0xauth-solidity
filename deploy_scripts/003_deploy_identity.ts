import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //   await _deploy(hre);
};
export default func;
func.tags = ['Identity'];

async function _deploy(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployerWallet, aliceWallet } = await getNamedAccounts();

  await deploy('Identity', {
    from: deployerWallet,
    args: [aliceWallet, false],
    log: true,
    autoMine: true,
  });
}
