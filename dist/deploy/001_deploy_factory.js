"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const deployContracts = async function (hre) {
    await _deploy(hre);
};
async function _deploy(hre) {
    console.log('Deploying contracts...');
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerWallet, claimIssuerWallet } = await getNamedAccounts();
    console.log(`Deploying contracts with the account: ${deployerWallet}`);
    const implementationAuthority = await deploy('ImplementationAuthority', {
        from: deployerWallet,
        args: [],
        log: true,
    });
    const factory = await deploy('IdFactory', {
        from: deployerWallet,
        args: [implementationAuthority.address, true],
        log: true,
    });
    const identityImplementation = await deploy('Identity', {
        from: deployerWallet,
        args: [deployerWallet, true, factory.address],
        log: true,
    });
    // Get the signer for the deployer's wallet
    const deployerSigner = await hardhat_1.ethers.getSigner(deployerWallet);
    // Get the contract instance of ImplementationAuthority
    const instance_implementationAuthority = await hardhat_1.ethers.getContractAt('ImplementationAuthority', implementationAuthority.address, deployerSigner);
    // Call updateImplementation on ImplementationAuthority
    const tx_updateImplementation = await instance_implementationAuthority.updateImplementation(identityImplementation.address);
    await tx_updateImplementation.wait();
    const gateway = await deploy('Gateway', {
        from: deployerWallet,
        args: [factory.address, [deployerWallet]],
        log: true,
    });
    const claimIssuer = await deploy('ClaimIssuer', {
        from: deployerWallet,
        args: [claimIssuerWallet, factory.address],
        log: true,
        autoMine: true,
    });
    console.log(`Deployed Identity implementation at ${identityImplementation.address}`);
    console.log(`Deployed Implementation Authority at ${implementationAuthority.address}`);
    console.log(`Deployed Factory at ${factory.address}`);
    console.log(`Deployed Gateway at ${gateway.address}`);
    console.log(`Deployed ClaimIssuer at ${claimIssuer.address}`);
}
exports.default = deployContracts;
deployContracts.tags = [
    'IdFactory',
    'ImplementationAuthority',
    'Identity',
    'Gateway',
    'ClaimIssuer',
];
