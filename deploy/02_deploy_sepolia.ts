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

    const BRIDGE_CONTRACT_AMOY_address = `0x6bf574fE78dc43b6e8E88eF860fE176185EE81Cd`;
    const GATEWAY_AMOY_address = `0x6ed284b4d57CD82C3B1D05A2d2DF2AEE032C78af`;
    

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

  console.log("nonce", await deployerSigner.getNonce());


  const implementationAuthority = await deploy('ImplementationAuthority', {
    from: deployerWallet,
    args: [],
    log: true,
  });

  console.log('DeployerWallet nonce : ', await deployerSigner.getNonce());
  console.log('implementationAuthority op sepolia : ', implementationAuthority.address);

  const bridge = await deploy('CrossChainBridge', {
    from: deployerWallet,
    args: [(
      await CONTRACT_CONFIG()
    ).ccipRouterAddressOP_SEPOLIA],
    log: true,
  });
  
  console.log('DeployerWallet nonce : ', await deployerSigner.getNonce());

  const factory = await deploy('IdFactory', {
    from: deployerWallet,
    args: [deployerWallet, implementationAuthority.address, true],
    log: true,
  });
  console.log('DeployerWallet nonce : ', await deployerSigner.getNonce());

  const identityImplementation = await deploy('Identity', {
    from: deployerWallet,
    args: [deployerWallet, false, factory.address],
    log: true,
  });

  console.log('DeployerWallet nonce : ', await deployerSigner.getNonce());

  const claimIssuer = await deploy('ClaimIssuer', {
    from: deployerWallet,
    args: [claimIssuerWallet, factory.address],
    log: true,
    autoMine: true,
  });


  console.log(`Deployed ClaimIssuer at ${claimIssuer.address}`);

  const gateway = await deploy('Gateway', {
    from: deployerWallet,
    args: [factory.address, [deployerWallet]],
    log: true,
  });

  console.log(`Deployed Gateway at ${gateway.address}`);


  // Get the contract instance of ImplementationAuthority
  const instance_implementationAuthority = await ethers.getContractAt(
    'ImplementationAuthority',
    implementationAuthority.address,
    deployerSigner, // Use deployer's signer
  );

  // Call updateImplementation on ImplementationAuthority
  const tx_updateImplementation =
    await instance_implementationAuthority.updateImplementation(
      identityImplementation.address,
    );
  await tx_updateImplementation.wait();


  // Get the contract instance of ImplementationAuthority
  const instance_factory = await ethers.getContractAt(
    'IdFactory',
    factory.address,
    deployerSigner, // Use deployer's signer
  );

  await instance_factory.setBridge(bridge.address);

  await instance_factory.addReceiver((
    await CONTRACT_CONFIG()
  ).ccipChainSelectorAMOY, BRIDGE_CONTRACT_AMOY_address, GATEWAY_AMOY_address);

  const instance_bridge = await ethers.getContractAt(
    'CrossChainBridge',
    bridge.address,
    deployerSigner, // Use deployer's signer
  );

  await instance_bridge.setAllowedContract(factory.address, true);
  await instance_bridge.setFactoryAddress(factory.address);

  console.log('-> Step : Bridge OP_SEPOLIA: Fund bridge');


  await deployerSigner.sendTransaction({
    to: bridge.address,
    value: ethers.parseEther('0.1'),
  })

  console.log('-> Step : ID factory OP_SEPOLIA: Create identity');

  const tx_createIdentity = await instance_factory.createIdentity(bobWallet, 'saqlt1');
  await tx_createIdentity.wait();
  

  // const tx_createIdentityalice = await instance_factory.createIdentity(aliceWallet, 'alicesalt1');
  // await tx_createIdentityalice.wait();

  
  // console.log('Identity ALICE OP_SEPOLIA Address:', await instance_factory.getIdentity(aliceWallet));


  const instance_identity = await ethers.getContractAt(
    'Identity',
    await instance_factory.getIdentity(bobWallet),
    bobWalletSigner,
  )
  console.log('Identity BOB OP_SEPOLIA Address:', await instance_factory.getIdentity(bobWallet));


  console.log('-> Step : Identity OP_SEPOLIA: Add key');
  const aliceKeyHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address'],
      [aliceWallet],
    ),
  );

  const tx_addKey = await instance_identity.addKey(aliceKeyHash, 1, 3);
  const receipt_addKey = await tx_addKey.wait();
  const aliceKey = await instance_identity.getKey(aliceKeyHash);
  console.log('aliceKey : ', aliceKey);


  let claim = {
    identity: await instance_identity.getAddress(),
    issuer: await instance_identity.getAddress(),
    topic: 42,
    scheme: 1,
    data: '0x0042',
    signature: '',
    uri: 'https://sepolia-optimism.etherscan.io/address/0x2B0251FC7497CCEF48ecc564274d511F59Dc8074',
  };

  const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint'], // Specify the types
    [claim.issuer, claim.topic]      // Provide the values
  );
  console.log('encodedData', ethers.keccak256(encodedData));

  claim.signature = await claimIssuerWalletSigner.signMessage(ethers.getBytes(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [deployerWallet, claim.topic, claim.data]))));

  const tx_addClaim = await instance_identity.addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);

  // bytes32 claimId = keccak256(abi.encode(_issuer, _topic));
  const receipt_addClaim = await tx_addClaim.wait();

  const claimAddedEvent = receipt_addClaim?.logs
  console.log("receipt_addClaim", receipt_addClaim)
  let claimId;
  
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

console.log("calling tx_createIdentityWithManagementKeys")
const tx_createIdentityWithManagementKeys = await instance_factory.createIdentityWithManagementKeys(aliceWallet, 'aliceWalletsaqlt1',[
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address'],
      [deployerWallet],
    ),
  ),
]);
const receipt_tx_createIdentityWithManagementKeys = await tx_createIdentityWithManagementKeys.wait();
console.log("receipt_tx_createIdentityWithManagementKeys", receipt_tx_createIdentityWithManagementKeys)
  console.log(
    `Deployed Identity implementation at ${identityImplementation.address}`,
  );

  console.log(
    `Deployed Implementation Authority at ${implementationAuthority.address}`,
  );
  console.log(`Deployed Factory at ${factory.address}`);
}
async function SETUP_NETWORK(_network: string, rpc: string) {
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
