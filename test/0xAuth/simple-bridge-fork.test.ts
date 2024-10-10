import {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} from '@chainlink/local/scripts/CCIPLocalSimulatorFork';

import { node_url, accounts, addForkConfiguration } from '../../utils/network';
import { ethers, network } from 'hardhat';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers as v5ethers } from 'v5ethers';
import { CrossChainBridge, IdFactory } from '../../typechain-types';
import { generateWallet } from '../../utils/wallet-generate';
import { Wallet } from 'ethers';

describe('Bridge Fork Test', function () {
  console.log('Starting Test');
  before(async () => {
    const BASE = node_url('BNB'); // Archive node
    const ARB = node_url('AMOY'); // Archive node

    const [
      _0xAuthFundingWallet,
      claimIssuerWallet,
      aliceWallet,
      bobWallet,
      carolWallet,
      davidWallet,
    ] = await ethers.getSigners();

    const _newDeployerWallet = await generateWallet();

    const newDeployerWallet = new Wallet(
      _newDeployerWallet.privateKey,
      ethers.provider,
    );

    await SETUP_NETWORK('BASE', BASE);

    let { BRIDGE_CONTRACT_BASE, GATEWAY_BASE, identityFactory_BASE } =
      await deploy_fixture_base(_0xAuthFundingWallet, newDeployerWallet);

    await SETUP_NETWORK('ARB', ARB);

    let { BRIDGE_CONTRACT, identityFactory } = await deploy_fixture_arb(
      _0xAuthFundingWallet,
      newDeployerWallet,
    );

    console.log(
      '-> Step : ID factory ARB: setup bridge, gateway, chain selectors',
    );

    await identityFactory
      .connect(newDeployerWallet)
      .setBridge(BRIDGE_CONTRACT.target);

    await identityFactory
      .connect(newDeployerWallet)
      .addReceiver(
        (
          await CONTRACT_CONFIG()
        ).ccipChainSelectorBase,
        BRIDGE_CONTRACT_BASE.target,
        GATEWAY_BASE.target,
      );

    console.log(
      '-> Step : Bridge ARB: whitelist ID factory and setup id factory',
    );

    await BRIDGE_CONTRACT.connect(newDeployerWallet).setAllowedContract(
      identityFactory.target,
      true,
    );

    await BRIDGE_CONTRACT.connect(newDeployerWallet).setFactoryAddress(
      identityFactory.target,
    );

    console.log('-> Step : Bridge ARB: Fund bridge');

    await _0xAuthFundingWallet.sendTransaction({
      to: await BRIDGE_CONTRACT.getAddress(),
      value: ethers.parseEther('2.0'),
    });

    console.log('-> Step : ID factory ARB: Create identity');

    const tx = await identityFactory
      .connect(newDeployerWallet)
      .createIdentity(davidWallet.address, '432s4324234234alt1');

      // .createIdentityWithManagementKeys(davidWallet.address, '432s4324234234alt1', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [aliceWallet.address])) ]);

    await expect(tx).to.emit(identityFactory, 'WalletLinked');
    await expect(tx).to.emit(identityFactory, 'Deployed');

    const receipt = await tx.wait();
    if (!receipt) return;
    const evm2EvmMessage = await getEvm2EvmMessage(receipt);

    const identity = await ethers.getContractAt(
      'Identity',
      await identityFactory.getIdentity(davidWallet.address),
    );
    console.log('Identity ARB Address:', await identity.getAddress());

    console.log('-> Step : Identity ARB: Add key');

    const aliceKeyHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address'],
        [aliceWallet.address],
      ),
    );

    // David adds Alice's key
    const tx_addKey = await identity
      .connect(davidWallet)
      .addKey(aliceKeyHash, 1, 1);
    const receipt_addKey = await tx_addKey.wait();

    const aliceKey = await identity.getKey(aliceKeyHash);
    expect(aliceKey.key).to.equal(aliceKeyHash);

    if (!receipt_addKey) return;
    const evm2EvmMessage_addKey = await getEvm2EvmMessage(receipt_addKey);

    if (!evm2EvmMessage_addKey) return;

    console.log('-> Step : Identity ARB: Add Claim');
    /// TODO : Add claim

    const ClaimIssuer = await ethers.getContractFactory('ClaimIssuer');

    const claimIssuer = await ClaimIssuer.connect(claimIssuerWallet).deploy(claimIssuerWallet.address, identityFactory.getAddress());
    console.log('ClaimIssuer Address:', await claimIssuer.getAddress());

    let claim = {
      identity: await identity.getAddress(),
      issuer: await identity.getAddress(),
      topic: 42,
      scheme: 1,
      data: '0x0042',
      signature: '',
      uri: 'https://example.com',
    };

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint'], // Specify the types
      [claim.issuer, claim.topic]      // Provide the values
    );
    const claimId = ethers.keccak256(encodedData)
    console.log('encodedData', claimId);

    claim.signature = await claimIssuerWallet.signMessage(ethers.getBytes(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [davidWallet.address, claim.topic, claim.data]))));
    console.log('claim.signature', claim.signature);
    const tx_addClaim = await identity.connect(aliceWallet).addClaim(claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);

    // bytes32 claimId = keccak256(abi.encode(_issuer, _topic));
    const receipt_addClaim = await tx_addClaim.wait();

    const claimAddedEvent = receipt_addClaim?.logs

    const evm2EvmMessage_addClaim = await getEvm2EvmMessage(receipt_addClaim);

    // const carolWalletkeyHash = ethers.keccak256(
    //   ethers.AbiCoder.defaultAbiCoder().encode(
    //     ['address'],
    //     [carolWallet.address],
    //   ),
    // );
    // const tx_createIdentityWithManagementKeys = await identityFactory
    //   .connect(newDeployerWallet)
    //   .createIdentityWithManagementKeys(aliceWallet.address, '432salt1', [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [carolWallet.address])) ]);

    //   const receipt_tx_createIdentityWithManagementKeys = await tx_createIdentityWithManagementKeys.wait();

    // console.log("receipt_tx_createIdentityWithManagementKeys", receipt_tx_createIdentityWithManagementKeys?.logs)

    // const evm2EvmMessage_createIdentityWithManagementKeys = await getEvm2EvmMessage(receipt_tx_createIdentityWithManagementKeys);


    const tx_removeClaim = await identity.connect(aliceWallet).removeClaim(claimId);
    const receipt_removeClaim = await tx_removeClaim.wait();

    if (!receipt_removeClaim) return;
    const evm2EvmMessage_removeClaim = await getEvm2EvmMessage(receipt_removeClaim);

    if (!evm2EvmMessage_removeClaim) return;


    const tx_removeKey = await identity
    .connect(davidWallet)
    .removeKey(aliceKeyHash, 1);
  const receipttx_removeKey= await tx_removeKey.wait();


  if (!receipttx_removeKey) return;
  const evm2EvmMessage_removeKey = await getEvm2EvmMessage(receipttx_removeKey);

  if (!evm2EvmMessage_removeKey) return;

  

    await SETUP_NETWORK('BASE', BASE);

    ({ BRIDGE_CONTRACT_BASE, GATEWAY_BASE, identityFactory_BASE } =
      await deploy_fixture_base(_0xAuthFundingWallet, newDeployerWallet));

    console.log('-> Step : ID factory BASE: setup bridge, gateway');
    await identityFactory_BASE
      .connect(newDeployerWallet)
      .setAllowedContract(GATEWAY_BASE.target, true);
    await identityFactory_BASE
      .connect(newDeployerWallet)
      .setAllowedContract(BRIDGE_CONTRACT_BASE.target, true);

    await identityFactory_BASE
      .connect(newDeployerWallet)
      .setBridge(BRIDGE_CONTRACT_BASE.target);

    console.log('-> Step : CCIP BASE: Forward message');

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

    if (!evm2EvmMessage_addKey) return;
    try {
      await routeMessage(
        (
          await CONTRACT_CONFIG()
        ).ccipRouterAddressBase,
        evm2EvmMessage_addKey,
      );
    } catch (e) {
      console.log('evm2EvmMessage_addKey Error : ', e);
    }
    const aliceKey_BASE = await identity_twin.getKey(aliceKeyHash);
    expect(aliceKey_BASE.key.toString()).to.equal(aliceKeyHash.toString());
    console.log('Alice key is matching');

    if (!evm2EvmMessage_addClaim) return;
    try {
      await routeMessage(
        (
          await CONTRACT_CONFIG()
        ).ccipRouterAddressBase,
        evm2EvmMessage_addClaim,
      );
    } catch (e) {
      console.log('evm2EvmMessage_addClaim Error : ', e);
    }
    if (!evm2EvmMessage_removeKey) return;
    try {
      await routeMessage(
        (
          await CONTRACT_CONFIG()
        ).ccipRouterAddressBase,
        evm2EvmMessage_removeKey,
      );
    } catch (e) {
      console.log('evm2EvmMessage_removeKey Error : ', e);
    }

    // if (!evm2EvmMessage_createIdentityWithManagementKeys) return;
    // try {
    //   await routeMessage(
    //     (
    //       await CONTRACT_CONFIG()
    //     ).ccipRouterAddressBase,
    //     evm2EvmMessage_createIdentityWithManagementKeys,
    //   );
    // } catch (e) {
    //   console.log('evm2EvmMessage_createIdentityWithManagementKeys Error : ', e);
    // }

    const aliceClaim_BASE2 = await identity_twin.getClaim(claimId);
    // console.log(' Claim aliceClaim_BASE2:', aliceClaim_BASE2);
    // console.log("evm2EvmMessage_addClaim", evm2EvmMessage_addClaim)

    const aliceClaim_BASE = await identity_twin.getClaim(claimId);
    // console.log(' Claim BASE:', aliceClaim_BASE);
    // Format the retrieved claim to match our initial claim object format
    const formattedClaim = {
      topic: aliceClaim_BASE[0],
      scheme: aliceClaim_BASE[1],
      issuer: aliceClaim_BASE[2],
      signature: aliceClaim_BASE[3],
      data: aliceClaim_BASE[4],
      uri: aliceClaim_BASE[5]
    };

    // Verify each component of the retrieved claim matches the original claim
    expect(formattedClaim.topic).to.equal(claim.topic);
    expect(formattedClaim.scheme).to.equal(claim.scheme);
    expect(formattedClaim.issuer).to.equal(claim.issuer);
    expect(formattedClaim.signature).to.equal(claim.signature);
    expect(formattedClaim.data).to.equal(claim.data);
    expect(formattedClaim.uri).to.equal(claim.uri);
    console.log("AddClaim passed")

    const aliceRemovedKey_BASE = await identity_twin.getKey(aliceKeyHash);
    expect(aliceRemovedKey_BASE.key.toString()).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    console.log('Alice Removed key is working');
    if (!evm2EvmMessage_removeClaim) return;
    try {
      await routeMessage(
        (
          await CONTRACT_CONFIG()
        ).ccipRouterAddressBase,
        evm2EvmMessage_removeClaim,
      );
    } catch (e) {
      console.log('evm2EvmMessage_removeClaim Error : ', e);
    }
    const aliceRemovedClaim_BASE = await identity_twin.getClaim(claimId)
      // Format the retrieved claim to match our initial claim object format
      const formattedRemovedClaim = {
        topic: aliceRemovedClaim_BASE[0],
        scheme: aliceRemovedClaim_BASE[1],
        issuer: aliceRemovedClaim_BASE[2],
        signature: aliceRemovedClaim_BASE[3],
        data: aliceRemovedClaim_BASE[4],
        uri: aliceRemovedClaim_BASE[5]
      };

    // Add assertions to ensure the returned values match the expected values
    expect(formattedRemovedClaim.topic).to.equal(0n);
    expect(formattedRemovedClaim.scheme).to.equal(0n);
    expect(formattedRemovedClaim.issuer).to.equal("0x0000000000000000000000000000000000000000");
    expect(formattedRemovedClaim.signature).to.equal("0x");
    expect(formattedRemovedClaim.data).to.equal("0x");
    expect(formattedRemovedClaim.uri).to.equal("");
    console.log("RemoveClaim is Working")
    
    /**
     */
  });

  it('Bridge fork working ', async function () {
    console.log('Bridge fork working');
  });
});

async function SETUP_NETWORK(_network: string, rpc: string) {
  if (_network.toUpperCase() === 'ARB') {
    console.log('\n---------------------ARB----------------------');

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

  if (_network.toUpperCase() === 'BASE') {
    console.log('\n---------------------BASE----------------------');

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
  const ccipRouterAddressArbSepolia = `0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2`;
  const ccipRouterAddressBase = `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`;
  const ccipChainSelectorBase = 16015286601757825753n;

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

async function deploy_fixture_base(
  _0xAuthFundingWallet: HardhatEthersSigner,
  newDeployerWallet: Wallet,
) {
  await _0xAuthFundingWallet.sendTransaction({
    to: newDeployerWallet.address,
    value: ethers.parseEther('10.0'),
  });
  const implementationAuthority = await (
    await CONTRACT_CONFIG()
  ).ImplementationAuthority_Factory.connect(newDeployerWallet).deploy({});

  await implementationAuthority.waitForDeployment();

  const BRIDGE_CONTRACT_BASE = await (
    await CONTRACT_CONFIG()
  ).Bridge_Factory.connect(newDeployerWallet).deploy(
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressBase,
  );

  console.log('BRIDGE_CONTRACT_BASE : ', BRIDGE_CONTRACT_BASE.target);

  console.log('newDeployerWallet nonce : ', await newDeployerWallet.getNonce());
  const identityFactory_BASE = await (
    await CONTRACT_CONFIG()
  ).IdFactory_Factory.connect(newDeployerWallet).deploy(
    newDeployerWallet.address,
    implementationAuthority.target,
    /// @notice : Change it to false where isHomeChain should be false
    false,
  );
  await identityFactory_BASE.waitForDeployment();

  console.log('identityFactory_BASE : ', identityFactory_BASE.target);

  const GATEWAY_BASE = await (
    await CONTRACT_CONFIG()
  ).Gateway_Factory.connect(newDeployerWallet).deploy(
    await identityFactory_BASE.getAddress(),
    [await BRIDGE_CONTRACT_BASE.getAddress(), newDeployerWallet.address],
  );

  console.log('GATEWAY_BASE : ', GATEWAY_BASE.target);

  const identityImplementation = await (
    await CONTRACT_CONFIG()
  ).Identity_Factory.connect(newDeployerWallet).deploy(
    newDeployerWallet.address,
    // NOTICE : Change it to true if contract isLibrary
    false,
    identityFactory_BASE.getAddress(),
  );
  await identityImplementation.waitForDeployment();

  const tx_updateImplementation = await implementationAuthority
    .connect(newDeployerWallet)
    .updateImplementation(identityImplementation.getAddress());
  await tx_updateImplementation.wait();

  return { BRIDGE_CONTRACT_BASE, identityFactory_BASE, GATEWAY_BASE };
}

async function deploy_fixture_arb(
  _0xAuthFundingWallet: HardhatEthersSigner,
  newDeployerWallet: Wallet,
): Promise<{
  BRIDGE_CONTRACT: CrossChainBridge;
  identityFactory: IdFactory;
}> {
  await _0xAuthFundingWallet.sendTransaction({
    to: newDeployerWallet.address,
    value: ethers.parseEther('10.0'),
  });
  const implementationAuthority = await (
    await CONTRACT_CONFIG()
  ).ImplementationAuthority_Factory.connect(newDeployerWallet).deploy({});

  await implementationAuthority.waitForDeployment();

  let BRIDGE_CONTRACT = await (
    await CONTRACT_CONFIG()
  ).Bridge_Factory.connect(newDeployerWallet).deploy(
    (
      await CONTRACT_CONFIG()
    ).ccipRouterAddressArbSepolia,
  );

  console.log('BRIDGE_CONTRACT : ', BRIDGE_CONTRACT.target);

  console.log('newDeployerWallet nonce : ', await newDeployerWallet.getNonce());
  const identityFactory = await (
    await CONTRACT_CONFIG()
  ).IdFactory_Factory.connect(newDeployerWallet).deploy(
    newDeployerWallet.address,
    implementationAuthority.target,
    /// @notice : Change it to false where isHomeChain should be false
    true,
  );
  await identityFactory.waitForDeployment();
  console.log('identityFactory : ', identityFactory.target);

  const identityImplementation = await (
    await CONTRACT_CONFIG()
  ).Identity_Factory.connect(newDeployerWallet).deploy(
    newDeployerWallet.address,
    // NOTICE : Change it to true if contract isLibrary
    false,
    identityFactory.getAddress(),
  );
  await identityImplementation.waitForDeployment();

  const tx_updateImplementation = await implementationAuthority
    .connect(newDeployerWallet)
    .updateImplementation(identityImplementation.getAddress());
  await tx_updateImplementation.wait();

  return { BRIDGE_CONTRACT, identityFactory };
}
