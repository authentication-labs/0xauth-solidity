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

    const BRIDGE_CONTRACT_OP_SEPOLIA_address = `0x55a3EE57b760BfFcfce101Ff442415e1C924c578`;
    const GATEWAY_OP_SEPOLIA_address = `0xA76919A0d0d547abac431708fA871dbE21753c46`;
    

  console.log('Deploying contracts...');
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployerWallet, claimIssuerWallet, aliceWallet, bobWallet } = await getNamedAccounts();
  console.log("claimIssuerWallet",claimIssuerWallet)
  // Get the signer for the deployer's wallet
  const deployerSigner = await ethers.getSigner(deployerWallet);
  const bobWalletSigner = await ethers.getSigner(bobWallet);
  const aliceWalletSigner = await ethers.getSigner(aliceWallet);
  const claimIssuerWalletSigner = await ethers.getSigner(claimIssuerWallet);
  console.log(`Deploying contracts with the account: ${deployerWallet}`);

 
  // Get the contract instance of ImplementationAuthority
  const instance_factory = await ethers.getContractAt(
    'IdFactory',
    "0x309bBBB5b773640a0Ee9972fD0B805b9D9dbC627",
    deployerSigner, // Use deployer's signer
  );
 
  await instance_factory.removeReceiver((
    await CONTRACT_CONFIG()
  ).ccipChainSelectorOP_SEPOLIA);

  const elect = 5224473277236331295n;

  await instance_factory.addReceiver(
    elect, BRIDGE_CONTRACT_OP_SEPOLIA_address, GATEWAY_OP_SEPOLIA_address);
  const testWallet = "0x34Be555065c984e4fb75d37D0b623F3388c7772b";

  console.log('-> Step : ID factory OP_SEPOLIA: Create identity With Management Keys');   
  const tx_createIdentity = await instance_factory.createIdentityWithManagementKeys(testWallet, 'saltnewadd15fake', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet])) ]);
  await tx_createIdentity.wait();
     
  console.log('Identity Created OP_SEPOLIA Address:', await instance_factory.getIdentity(testWallet));

// if (claimAddedEvent && claimAddedEvent.length > 0) {
//   console.log("All ClaimAdded events:");

//   claimAddedEvent.forEach((eventLog, index) => {
//     // Assuming the event you are interested in is at a specific index, adjust if needed
//     // Check if the eventLog is indeed the ClaimAdded event
//     console.log(`Event ${index + 1}:`, eventLog);
    
//     // If you are specifically looking for `claimId` and it is in the event arguments
//     if (eventLog.args && eventLog.args.length > 0) {
//       const claimId = eventLog.args[0];
//       console.log(`Claim ID from Event ${index + 1}:`, claimId);
//     } else {
//       console.log(`No claimId found in Event ${index + 1}`);
//     }
//   });
// } else {
//   console.log('No ClaimAdded events found in the receipt');
// }

// console.log("calling tx_createIdentityWithManagementKeys")
// const tx_createIdentityWithManagementKeys = await instance_factory.createIdentityWithManagementKeys(aliceWallet, 'aliceWalletsaqlt1',[
//   ethers.keccak256(
//     ethers.AbiCoder.defaultAbiCoder().encode(
//       ['address'],
//       [deployerWallet],
//     ),
//   ),
// ]);
// const receipt_tx_createIdentityWithManagementKeys = await tx_createIdentityWithManagementKeys.wait();
// console.log("receipt_tx_createIdentityWithManagementKeys", receipt_tx_createIdentityWithManagementKeys)

 
}
async function SETUP_NETWORK(_network: string, rpc: string) {
  if (_network.toUpperCase() === 'AMOY') {
    console.log('\n---------------------AMOY----------------------');

    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: rpc
          },
        },
      ],
    });
  }

  if (_network.toUpperCase() === 'OP_SEPOLIA') {
    console.log('\n---------------------OP_SEPOLIA----------------------');

    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: rpc
          },
        },
      ],
    });
  }
}

async function CONTRACT_CONFIG() {
  
const ccipRouterAddressAMOY = 0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2;
const ccipRouterAddressOP_SEPOLIA = 0x600f00aef9b8ED8EDBd7284B5F04a1932c3408aF;
const ccipChainSelectorOP_SEPOLIA = 5224473277236331295;


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
    ccipRouterAddressAMOY,
    ccipRouterAddressOP_SEPOLIA,
    ccipChainSelectorOP_SEPOLIA,
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
