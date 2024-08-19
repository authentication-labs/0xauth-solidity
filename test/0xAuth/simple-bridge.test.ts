import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { deployIdentityFixture, deployFactoryFixture } from '../fixtures';
import {
  CrossChainBridge,
  CCIPLocalSimulator,
  IdFactory,
  Gateway,
} from '../../typechain-types';

import {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} from '@chainlink/local/scripts/CCIPLocalSimulatorFork';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('Bridge Test', function () {
  // Variables to store the fixture results
  let localSimulator: CCIPLocalSimulator,
    BRIDGE_CONTRACT: CrossChainBridge,
    ccip_config: any,
    GATEWAY: Gateway;
  let identityFactory: IdFactory,
    identityFactory_2: IdFactory,
    identityImplementation,
    implementationAuthority;
  let aliceWallet,
    bobWallet,
    carolWallet,
    davidWallet: HardhatEthersSigner,
    deployerWallet: any,
    claimIssuerWallet;

  async function BridgeSetup() {
    const deployFactoryResults = await loadFixture(deployFactoryFixture);
    const {
      identityFactory: idFactory,
      identityFactory_2: idFactory2,
      identityImplementation: idImplementation,
      implementationAuthority: implAuthority,
      aliceWallet: alice,
      bobWallet: bob,
      carolWallet: carol,
      davidWallet: david,
      deployerWallet: deployer,
      claimIssuerWallet: claimIssuer,
    } = deployFactoryResults;

    identityFactory = idFactory;
    identityFactory_2 = idFactory2;
    identityImplementation = idImplementation;
    implementationAuthority = implAuthority;
    aliceWallet = alice;
    bobWallet = bob;
    carolWallet = carol;
    davidWallet = david;
    deployerWallet = deployer;
    claimIssuerWallet = claimIssuer;

    const localSimulatorFactory = await ethers.getContractFactory(
      'CCIPLocalSimulator',
    );
    localSimulator = await localSimulatorFactory.deploy();

    ccip_config = await localSimulator.configuration();

    const BRIDGE_FACTORY = await ethers.getContractFactory('CrossChainBridge');
    BRIDGE_CONTRACT = await BRIDGE_FACTORY.deploy(
      ccip_config.sourceRouter_,
      ccip_config.destinationRouter_,
    );

    const GatewayFactory = await ethers.getContractFactory('Gateway');
    GATEWAY = await GatewayFactory.connect(deployerWallet).deploy(
      identityFactory_2.getAddress(),
      [BRIDGE_CONTRACT.getAddress(), deployerWallet.address],
    );

    return {
      localSimulator,
      BRIDGE_CONTRACT,
      ccip_config,
      deployerWallet,
      GATEWAY,
      identityFactory,
      identityFactory_2,
      identityImplementation,
      implementationAuthority,
      aliceWallet,
      bobWallet,
      carolWallet,
      davidWallet,
      claimIssuerWallet,
    };
  }

  before(async () => {
    await BridgeSetup();
    console.log('Bridge Contract Address:', await BRIDGE_CONTRACT.getAddress());
    console.log(
      'Identity Factory 1 Address:',
      await identityFactory.getAddress(),
    );
    console.log(
      'Identity Factory 2 Address:',
      await identityFactory_2.getAddress(),
    );
    console.log('Gateway Address:', await GATEWAY.getAddress());
  });

  it('ID factory 1: setup bridge, gateway, chain selectors', async function () {
    await identityFactory
      .connect(deployerWallet)
      .setBridge(BRIDGE_CONTRACT.getAddress());

    await identityFactory
      .connect(deployerWallet)
      .addReceiver(
        ccip_config.chainSelector_,
        await BRIDGE_CONTRACT.getAddress(),
        await GATEWAY.getAddress(),
      );

    await identityFactory
      .connect(deployerWallet)
      .setAllowedContract(await GATEWAY.getAddress(), true);

    expect(await identityFactory.getBridge()).to.equal(
      await BRIDGE_CONTRACT.getAddress(),
    );

    expect(
      await identityFactory.getReceiver(ccip_config.chainSelector_),
    ).to.equal(await BRIDGE_CONTRACT.getAddress());

    expect((await identityFactory.getReceivers())[0]).to.equal(
      await BRIDGE_CONTRACT.getAddress(),
    );
  });

  it('ID factory 2: setup bridge, gateway', async function () {
    await identityFactory_2
      .connect(deployerWallet)
      .setAllowedContract(await GATEWAY.getAddress(), true);
    await identityFactory_2
      .connect(deployerWallet)
      .setAllowedContract(await BRIDGE_CONTRACT.getAddress(), true);
  });

  it('Bridge : whitelist id factory ', async function () {
    await BRIDGE_CONTRACT.connect(deployerWallet).setAllowedContract(
      identityFactory.getAddress(),
      true,
    );
  });

  it('Id Factory : deploy a new identity ', async function () {
    const TWO_ETHER = 2_000_000_000_000_000_000n;

    await deployerWallet.sendTransaction({
      to: BRIDGE_CONTRACT.getAddress(),
      value: TWO_ETHER,
    });

    // ---//
    const tx = await identityFactory
      .connect(deployerWallet)
      .createIdentity(davidWallet.address, 'salt1');

    await expect(tx).to.emit(identityFactory, 'WalletLinked');
    await expect(tx).to.emit(identityFactory, 'Deployed');

    const identity = await ethers.getContractAt(
      'Identity',
      await identityFactory.getIdentity(davidWallet.address),
    );

    const identity_twin = await ethers.getContractAt(
      'Identity',
      await identityFactory_2.getIdentity(davidWallet.address),
    );

    console.log('Identity Address:', await identity.getAddress());
    console.log('Identity Twin Address:', await identity_twin.getAddress());

    await expect(tx)
      .to.emit(identity, 'KeyAdded')
      .withArgs(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['address'],
            [davidWallet.address],
          ),
        ),
        1,
        1,
      );

    // --- //
  });
});
