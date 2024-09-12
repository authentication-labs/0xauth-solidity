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
    '0x5728B9736E1784cB7086A871fAb27a7CD8FC9042',
    deployerSigner, // Use deployer's signer
  );
 
  console.log('-> Step : ID factory OP_SEPOLIA: Create identity With Management Keys');
   
  const testWallet = "0xE082ECFfbE1b55f81692F3b88f05d4CCB59DAa08";
  const tx_createIdentity = await instance_factory.createIdentityWithManagementKeys(testWallet, 'saltedevm14', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet])) ]);
  await tx_createIdentity.wait();
     
  console.log('Identity Created OP_SEPOLIA Address:', await instance_factory.getIdentity(testWallet));


  const instance_identity = await ethers.getContractAt(
    'Identity',
    await instance_factory.getIdentity(testWallet),
    deployerSigner,
  ) 


  console.log('-> Step : Identity OP_SEPOLIA: Add key');
  const aliceKeyHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address'],
      [bobWallet],
    ),
  );

  const tx_addKey = await instance_identity.addKey(aliceKeyHash, 3, 1);
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
