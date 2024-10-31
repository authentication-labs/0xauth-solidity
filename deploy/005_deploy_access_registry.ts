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
    // args: [await idFactory.getAddress(), await claimIssuer.getAddress()],
    args: [
      '0x8A0Fa067dE12a527501FA009a2806AAD3d9df630',
      '0x6b0a61Bd492655845963044BFA70EB77FA1512a7',
    ],

    log: true,
    autoMine: true,
  });
};
export default func;
func.tags = ['AccessRegistry'];
