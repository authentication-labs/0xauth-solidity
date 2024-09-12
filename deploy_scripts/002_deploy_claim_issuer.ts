import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //   await _deploy(hre);
};
export default func;
func.tags = ['ClaimIssuer'];

async function _deploy(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployerWallet, claimIssuerWallet } = await getNamedAccounts();
  await deploy('ClaimIssuer', {
    from: deployerWallet,
    args: [claimIssuerWallet],
    log: true,
    autoMine: true,
  });
}
