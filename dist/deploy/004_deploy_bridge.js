"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployContracts = async function (hre) {
    //   await _deploy(hre);
};
async function _deploy(hre) {
    console.log('Deploying contracts...');
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerWallet } = await getNamedAccounts();
    console.log(`Deploying contracts with the account: ${deployerWallet}`);
    const crossChainBridge = await deploy('CrossChainBridge', {
        from: deployerWallet,
        args: ['0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2'], // Polygon Router
        log: true,
    });
    console.log(`Deployed CrossChainBridge implementation at ${crossChainBridge.address}`);
}
exports.default = deployContracts;
deployContracts.tags = [
    'IdFactory',
    'ImplementationAuthority',
    'Identity',
    'Gateway',
];
