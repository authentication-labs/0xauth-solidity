import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await _deploy(hre);
};
export default func;
func.tags = ['ProofFunction'];

async function _deploy(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployerWallet, claimIssuerWallet } = await getNamedAccounts();
  await deploy('ProofFunction', {
    from: deployerWallet,
    args: [`0xC17094E3A1348E5C7544D4fF8A36c28f2C6AAE28`], // OP Sepolia router address
    log: true,
    autoMine: true,
  });
}
