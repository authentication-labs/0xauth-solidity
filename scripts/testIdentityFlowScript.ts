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
    '0xF96E3e5a3949A3015AE5026d29fE12f98a95a4b7',
    deployerSigner, // Use deployer's signer
  );
  const testWallet = "0x34Be555065c984e4fb75d37D0b623F3388c7772b";


  console.log('-> Step : ID factory OP_SEPOLIA: Create identity With Management Keys');   
  const tx_createIdentity = await instance_factory.createIdentityWithManagementKeys(testWallet, 'saltnewadd15fake', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet])) ]);
  await tx_createIdentity.wait();
     
  console.log('Identity Created OP_SEPOLIA Address:', await instance_factory.getIdentity(testWallet));


  const instance_identity = await ethers.getContractAt(
    'Identity',
    await instance_factory.getIdentity(testWallet),
    deployerSigner,
  ) 


  // console.log('-> Step : Identity OP_SEPOLIA: Add key');
  const aliceKeyHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address'],
      [aliceWallet],
    ),
  );

  const tx_addKey = await instance_identity.addKey(aliceKeyHash, 2, 1);
  const receipt_addKey = await tx_addKey.wait();
  const aliceKey = await instance_identity.getKey(aliceKeyHash);
  console.log('aliceKey : ', await instance_identity.getKey(aliceKeyHash));


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
  // console.log('encodedData', ethers.keccak256(encodedData));

  let claimID = ethers.keccak256(encodedData)
  claim.signature = await claimIssuerWalletSigner.signMessage(ethers.getBytes(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [deployerWallet, claim.topic, claim.data]))));

  const tx_addClaim = await instance_identity.addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);

  // bytes32 claimId = keccak256(abi.encode(_issuer, _topic));
  const receipt_addClaim = await tx_addClaim.wait();

  console.log("Removing Claim")
  const tx_removeClaim = await instance_identity.removeClaim(claimID);
  const receipt_removeClaim = await tx_removeClaim.wait();
  console.log("Claim Removed")


  console.log("Removing Key")
  const tx_removeKey = await instance_identity.removeKey(aliceKeyHash, 2);
  const receipttx_removeKey= await tx_removeKey.wait();
  console.log("Key Removed")

}

export default deployContracts;
