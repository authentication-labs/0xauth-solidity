import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, network } from 'hardhat';
import { node_url } from '../utils/network';


const deployContracts: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  await _deploy(hre);
};

async function _deploy(hre: HardhatRuntimeEnvironment) {
 
  console.log('Deploying contracts...');
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployerWallet, claimIssuerWallet, aliceWallet, bobWallet } = await getNamedAccounts();
 
  const deployerSigner = await ethers.getSigner(deployerWallet);
 
  const instance_bridge = await ethers.getContractAt(
    'CrossChainBridge',
    '0x5Fc5050AF707915015f3B127f8850201C060a4d6',
    deployerSigner, // Use deployer's signer
  );
  await instance_bridge.withdraw('0x820F4c6eeF2DbACD463037571ccBDB761fd08AA1', ethers.parseEther('0.099036172740007646'));
 
} 
async function CONTRACT_CONFIG() {
  const ccipRouterAddressOP_SEPOLIA = `0x114A20A10b43D4115e5aeef7345a1A71d2a60C57`;
  const ccipRouterAddressAMOY = `0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2`;
  const ccipChainSelectorAMOY = 16281711391670634445n;


  // const ccipRouterAddressArbSepolia = `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`;
  // const ccipRouterAddressBase = `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`;
  // const ccipChainSelectorBase = 10344971235874465080n;

  const Bridge_Factory = await ethers.getContractFactory('CrossChainBridge');
  const ImplementationAuthority_Factory = await ethers.getContractFactory(
    'ImplementationAuthority',
  );

  const IdFactory_Factory = await ethers.getContractFactory('IdFactory');
  const Identity_Factory = await ethers.getContractFactory('Identity');
  const Gateway_Factory = await ethers.getContractFactory('Gateway');

  // Return the constants and factories
  return {
    ccipRouterAddressOP_SEPOLIA,
    ccipRouterAddressAMOY,
    ccipChainSelectorAMOY,
    Bridge_Factory,
    ImplementationAuthority_Factory,
    IdFactory_Factory,
    Identity_Factory,
    Gateway_Factory,
  };
}
 



export default deployContracts;
deployContracts.tags = [
  'IdFactory',
  'ImplementationAuthority',
  'Identity',
  'Gateway',
  'ClaimIssuer',
];
