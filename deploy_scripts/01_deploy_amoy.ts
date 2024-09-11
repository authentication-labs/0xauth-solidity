import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, network } from 'hardhat';
import { node_url } from '../utils/network';


const deployContracts1: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
    
  await _deploy(hre);
};

async function _deploy(hre: HardhatRuntimeEnvironment) { 
    await deploy_fixture_AMOY(hre); 
}

async function CONTRACT_CONFIG() {
  const ccipRouterAddressOP_SEPOLIA = `0x114A20A10b43D4115e5aeef7345a1A71d2a60C57`;
  const ccipRouterAddressAMOY = `0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2`;
  const ccipChainSelectorAMOY = 16281711391670634445n;


  // const ccipRouterAddressArbSepolia = `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`;
  // const ccipRouterAddressBase = `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`;
  // const ccipChainSelectorBase = 10344971235874465080n;

  const Bridge_Factory = await ethers.getContractFactory('CrossChainBridge');
  // const ImplementationAuthority_Factory = await ethers.getContractFactory(
  //   'ImplementationAuthority',
  // );

  const IdFactory_Factory = await ethers.getContractFactory('IdFactory');
  const Identity_Factory = await ethers.getContractFactory('Identity');
  const Gateway_Factory = await ethers.getContractFactory('Gateway');

  // Return the constants and factories
  return {
    ccipRouterAddressOP_SEPOLIA,
    ccipRouterAddressAMOY,
    ccipChainSelectorAMOY,
    Bridge_Factory,
    IdFactory_Factory,
    Identity_Factory,
    Gateway_Factory,
  };
}

async function deploy_fixture_AMOY(
  hre: HardhatRuntimeEnvironment,
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployerWallet,claimIssuerWallet, aliceWallet, bobWallet } = await getNamedAccounts();

  const deployerSigner = await ethers.getSigner(deployerWallet);

  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());
  const aliceWalletSigner = await ethers.getSigner(aliceWallet);
  console.log('deployerWallet address: ', deployerWallet);
  console.log('claimIssuerWallet address: ', claimIssuerWallet);

  const implementationAuthority = await deploy('ImplementationAuthority', {
    from: deployerWallet,
    args: [],
    log: true,
  });

  console.log('implementationAuthority : ', implementationAuthority.address);
  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());

  const BRIDGE_CONTRACT_AMOY = await deploy('CrossChainBridge', {
    from: deployerWallet,
    args: [(
      await CONTRACT_CONFIG()
    ).ccipRouterAddressAMOY],
    log: true,
  });

  console.log('BRIDGE_CONTRACT_AMOY : ', BRIDGE_CONTRACT_AMOY.address);
  console.log('deployerWallet address : ', await deployerSigner.getAddress());
  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());

  const identityFactory_AMOY = await deploy('IdFactory', {
    from: deployerWallet,
    args: [deployerWallet, implementationAuthority.address, false],
    log: true,
  });

  console.log('identityFactory_AMOY : ', identityFactory_AMOY.address);
  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());
// ------------------------------------
  
  const identityImplementation = await deploy('Identity', {
    from: deployerWallet,
    args: [deployerWallet, false, identityFactory_AMOY.address],
    log: true,
  });

  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());
  console.log('identityImplementation_amoy : ', identityImplementation.address);

  const claimIssuer = await deploy('ClaimIssuer', {
    from: deployerWallet,
    args: [claimIssuerWallet, identityFactory_AMOY.address],
    log: true,
    autoMine: true,
  });

  console.log(`Deployed ClaimIssuer at ${claimIssuer.address}`);
  
  const GATEWAY_AMOY = await deploy('Gateway', {
    from: deployerWallet,
    args: [identityFactory_AMOY.address, [BRIDGE_CONTRACT_AMOY.address, deployerWallet]],
    log: true,
  });

  console.log('GATEWAY_AMOY : ', GATEWAY_AMOY.address);
  console.log('newDeployerWallet nonce : ', await deployerSigner.getNonce());

  // Get the contract instance of ImplementationAuthority
  const instance_identityImplementation = await ethers.getContractAt(
    'ImplementationAuthority',
    implementationAuthority.address,
    deployerSigner, // Use deployer's signer
  );

  console.log('instance_identityImplementation owner: ', await instance_identityImplementation.owner());


  const tx_updateImplementation = await instance_identityImplementation.updateImplementation(identityImplementation.address);
  await tx_updateImplementation.wait(); 

  console.log('-> Step : ID factory AMOY: setup bridge, gateway');


  const instance_identityFactory_AMOY = await ethers.getContractAt(
    'IdFactory',
    identityFactory_AMOY.address,
    deployerSigner, // Use deployer's signer
  );

  const tx_setAllowedContract_gateway = await instance_identityFactory_AMOY.setAllowedContract(GATEWAY_AMOY.address, true);
  await tx_setAllowedContract_gateway.wait();

  console.log("GATEWAY_AMOY.target", GATEWAY_AMOY.address)

  const tx_setAllowedContract_bridge = await instance_identityFactory_AMOY.setAllowedContract(BRIDGE_CONTRACT_AMOY.address, true);
  await tx_setAllowedContract_bridge.wait();

  const tx_setBridge = await instance_identityFactory_AMOY.setBridge(BRIDGE_CONTRACT_AMOY.address);
  await tx_setBridge.wait();

  // Get the contract instance of ImplementationAuthority

  // const tx_createIdentityalice = await instance_identityFactory_AMOY.createIdentity(aliceWallet, 'alicesalt1');
  // await tx_createIdentityalice.wait();
  
  // console.log('Identity ALICE OP_SEPOLIA Address:', await instance_identityFactory_AMOY.getIdentity(aliceWallet));


  return { BRIDGE_CONTRACT_AMOY, identityFactory_AMOY, GATEWAY_AMOY };
}



export default deployContracts1; 
