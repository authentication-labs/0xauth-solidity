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
   
  const testWallet = "0x5031fB25B5d524965d2ad4490d67702d495d507a";
  const tx_createIdentity = await instance_factory.createIdentityWithManagementKeys(testWallet, 'saltnewadd13fake', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet])) ]);
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

export default deployContracts;
