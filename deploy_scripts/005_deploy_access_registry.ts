import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;

  const idFactory = await ethers.getContract('IdFactory');
  const claimIssuer = await ethers.getContract('ClaimIssuer');

  const { deployerWallet } = await getNamedAccounts();

  await deploy('xAuthAccessRegistry', {
    from: deployerWallet,
    args: [await idFactory.getAddress(), await claimIssuer.getAddress()],
    log: true,
    autoMine: true,
  });
};
export default func;
func.tags = ['AccessRegistry'];
