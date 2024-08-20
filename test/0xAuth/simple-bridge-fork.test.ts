const {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} = require('./helper-CCIPLocalSimulator.js');

import { node_url, accounts, addForkConfiguration } from '../../utils/network';
import { ethers, network } from 'hardhat';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { Addressable } from 'ethers';

// 1st Terminal: npx hardhat node
// 2nd Terminal: npx hardhat run ./scripts/myScript.ts --network localhost

async function main() {
  const BASE = node_url('BASE_SEPOLIA'); // Archive node
  const ARB = node_url('ARB_SEPOLIA'); // Archive node

  const [
    deployerWallet,
    claimIssuerWallet,
    aliceWallet,
    bobWallet,
    carolWallet,
    davidWallet,
  ] = await ethers.getSigners();

  // interface NonceMapping {
  //   [contract: string]: number;
  // }

  // const ARB_NONCE: NonceMapping = {};
  // const BASE_NONCE: NonceMapping = {};

  await SETUP_NETWORK('BASE', BASE);

  let { BRIDGE_CONTRACT_BASE, GATEWAY_BASE, identityFactory_BASE } =
    await deploy_fixture_base(deployerWallet);

  await SETUP_NETWORK('ARB', ARB);

  let { BRIDGE_CONTRACT, identityFactory } = await deploy_fixture_arb(
    deployerWallet,
  );

  console.log('ID factory ARB: setup bridge, gateway, chain selectors');

  await identityFactory
    .connect(deployerWallet)
    .setBridge(BRIDGE_CONTRACT.target);

  await identityFactory
    .connect(deployerWallet)
    .addReceiver(
      (
        await CONTRACT_CONFIG()
      ).ccipChainSelectorBase,
      BRIDGE_CONTRACT_BASE.target,
      GATEWAY_BASE.target,
    );

  console.log('Bridge ARB: whitelist ID factory');

  await BRIDGE_CONTRACT.connect(deployerWallet).setAllowedContract(
    identityFactory.target,
    true,
  );

  console.log('Bridge ARB: Fund bridge');

  await deployerWallet.sendTransaction({
    to: await BRIDGE_CONTRACT.getAddress(),
    value: ethers.parseEther('2.0'),
  });

  console.log('ID factory ARB: Create identity');

  const tx = await identityFactory
    .connect(deployerWallet)
    .createIdentity(davidWallet.address, 'salt1');

  await expect(tx).to.emit(identityFactory, 'WalletLinked');
  await expect(tx).to.emit(identityFactory, 'Deployed');

  const receipt = await tx.wait();
  if (!receipt) return;
  const evm2EvmMessage = getEvm2EvmMessage(receipt);

  const identity = await ethers.getContractAt(
    'Identity',
    await identityFactory.getIdentity(davidWallet.address),
  );
  console.log('Identity ARB Address:', await identity.getAddress());

  await SETUP_NETWORK('BASE', BASE);

  ({ BRIDGE_CONTRACT_BASE, GATEWAY_BASE, identityFactory_BASE } =
    await deploy_fixture_base(deployerWallet));

  console.log('ID factory BASE: setup bridge, gateway');
  await identityFactory_BASE
    .connect(deployerWallet)
    .setAllowedContract(GATEWAY_BASE.target, true);
  await identityFactory_BASE
    .connect(deployerWallet)
    .setAllowedContract(BRIDGE_CONTRACT_BASE.target, true);

  console.log('CCIP BASE: Forward message');

  if (!evm2EvmMessage) return;
  await routeMessage(
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressBase,
    evm2EvmMessage,
  );

  const identity_twin = await ethers.getContractAt(
    'Identity',
    await identityFactory_BASE.getIdentity(davidWallet.address),
  );

  console.log('Identity BASE Address:', await identity_twin.getAddress());
  /**
   */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function SETUP_NETWORK(_network: string, rpc: string) {
  if (_network.toUpperCase() === 'ARB') {
    console.log('\n---------------------ARB----------------------');

    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: rpc,
            blockNumber: 72349573,
          },
        },
      ],
    });
  }

  if (_network.toUpperCase() === 'BASE') {
    console.log('\n---------------------BASE----------------------');

    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: rpc,
            blockNumber: 14161630,
          },
        },
      ],
    });
  }
}

async function CONTRACT_CONFIG() {
  const ccipRouterAddressArbSepolia = `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`;
  const ccipRouterAddressBase = `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`;
  const ccipChainSelectorBase = 10344971235874465080n;

  const Bridge_Factory = await ethers.getContractFactory('CrossChainBridge');
  const ImplementationAuthority_Factory = await ethers.getContractFactory(
    'ImplementationAuthority',
  );

  const IdFactory_Factory = await ethers.getContractFactory('IdFactory');
  const Identity_Factory = await ethers.getContractFactory('Identity');
  const Gateway_Factory = await ethers.getContractFactory('Gateway');

  // Return the constants and factories
  return {
    ccipRouterAddressArbSepolia,
    ccipRouterAddressBase,
    ccipChainSelectorBase,
    Bridge_Factory,
    ImplementationAuthority_Factory,
    IdFactory_Factory,
    Identity_Factory,
    Gateway_Factory,
  };
}

async function deploy_fixture_base(deployerWallet: HardhatEthersSigner) {
  const implementationAuthority = await (
    await CONTRACT_CONFIG()
  ).ImplementationAuthority_Factory.connect(deployerWallet).deploy({});

  await implementationAuthority.waitForDeployment();

  const BRIDGE_CONTRACT_BASE = await (
    await CONTRACT_CONFIG()
  ).Bridge_Factory.deploy(
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressBase,
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressBase,
    {
      // nonce: BASE_NONCE['BRIDGE'],
    },
  );

  console.log('BRIDGE_CONTRACT_BASE : ', BRIDGE_CONTRACT_BASE.target);

  const identityFactory_BASE = await (
    await CONTRACT_CONFIG()
  ).IdFactory_Factory.connect(deployerWallet).deploy(
    implementationAuthority.target,
    // NOTICE : Change it to false where isHomeChain should be false
    false,
  );
  await identityFactory_BASE.waitForDeployment();

  console.log('identityFactory_BASE : ', identityFactory_BASE.target);

  // BASE_NONCE['Gateway'] = await deployerWallet.getNonce();

  const GATEWAY_BASE = await (
    await CONTRACT_CONFIG()
  ).Gateway_Factory.connect(deployerWallet).deploy(
    await identityFactory_BASE.getAddress(),
    [await BRIDGE_CONTRACT_BASE.getAddress(), deployerWallet.address],
    // { nonce: BASE_NONCE['Gateway'] },
  );

  console.log('GATEWAY_BASE : ', GATEWAY_BASE.target);

  const identityImplementation = await (
    await CONTRACT_CONFIG()
  ).Identity_Factory.connect(deployerWallet).deploy(
    deployerWallet.address,
    // NOTICE : Change it to true if contract isLibrary
    false,
    identityFactory_BASE.getAddress(),
  );
  await identityImplementation.waitForDeployment();

  const tx_updateImplementation = await implementationAuthority
    .connect(deployerWallet)
    .updateImplementation(identityImplementation.getAddress());
  await tx_updateImplementation.wait();

  return { BRIDGE_CONTRACT_BASE, identityFactory_BASE, GATEWAY_BASE };
}

async function deploy_fixture_arb(deployerWallet: HardhatEthersSigner) {
  const implementationAuthority = await (
    await CONTRACT_CONFIG()
  ).ImplementationAuthority_Factory.connect(deployerWallet).deploy({});

  await implementationAuthority.waitForDeployment();

  let BRIDGE_CONTRACT = await (
    await CONTRACT_CONFIG()
  ).Bridge_Factory.connect(deployerWallet).deploy(
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressArbSepolia,
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressArbSepolia,
    {
      // nonce: ARB_NONCE['BRIDGE'],
    },
  );

  console.log('BRIDGE_CONTRACT : ', BRIDGE_CONTRACT.target);

  const identityFactory = await (
    await CONTRACT_CONFIG()
  ).IdFactory_Factory.connect(deployerWallet).deploy(
    implementationAuthority.target,
    // NOTICE : Change it to false where isHomeChain should be false
    true,
  );
  await identityFactory.waitForDeployment();

  console.log('identityFactory : ', identityFactory.target);

  const identityImplementation = await (
    await CONTRACT_CONFIG()
  ).Identity_Factory.connect(deployerWallet).deploy(
    deployerWallet.address,
    // NOTICE : Change it to true if contract isLibrary
    false,
    identityFactory.getAddress(),
  );
  await identityImplementation.waitForDeployment();

  const tx_updateImplementation = await implementationAuthority
    .connect(deployerWallet)
    .updateImplementation(identityImplementation.getAddress());
  await tx_updateImplementation.wait();

  return { BRIDGE_CONTRACT, identityFactory };
}
