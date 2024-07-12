import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('Deploying contracts...');
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployerWallet } = await getNamedAccounts();

    console.log(`Deploying contracts with the account: ${deployerWallet}`);

    const crossChainBridge = await deploy('CrossChainBridge', {
        from: deployerWallet,
        args: ["0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2"], // Polygon Router
        log: true,
    });

    console.log(`Deployed CrossChainBridge implementation at ${crossChainBridge.address}`);
};

export default deployContracts;
deployContracts.tags = ['IdFactory', 'ImplementationAuthority', 'Identity', 'Gateway'];
