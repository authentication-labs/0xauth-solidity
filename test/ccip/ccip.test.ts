import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} from '@chainlink/local/scripts/CCIPLocalSimulatorFork';

describe('CCIPSender_Unsafe', function () {
  async function deploy() {
    const [
      deployerWallet,
      claimIssuerWallet,
      aliceWallet,
      bobWallet,
      carolWallet,
      davidWallet,
      tokenOwnerWallet,
    ] = await ethers.getSigners();
    const localSimulatorFactory = await ethers.getContractFactory(
      'CCIPLocalSimulator',
    );
    const localSimulator = await localSimulatorFactory.deploy();

    const config: {
      chainSelector_: bigint;
      sourceRouter_: string;
      destinationRouter_: string;
      wrappedNative_: string;
      linkToken_: string;
      ccipBnM_: string;
      ccipLnM_: string;
    } = await localSimulator.configuration();

    const CCIPSender_UnsafeFactory = await ethers.getContractFactory('Sender');
    const CCIPSender_Unsafe = await CCIPSender_UnsafeFactory.deploy(
      config.sourceRouter_,
      config.linkToken_,
    );

    const CCIPReceiver_UnsafeFactory = await ethers.getContractFactory(
      'Receiver',
    );
    const CCIPReceiver_Unsafe = await CCIPReceiver_UnsafeFactory.deploy(
      config.destinationRouter_,
    );

    const ccipBnMFactory = await ethers.getContractFactory('LinkTokenHelper');
    const ccipBnM = ccipBnMFactory.attach(config.ccipBnM_);

    return {
      localSimulator,
      CCIPSender_Unsafe,
      CCIPReceiver_Unsafe,
      config,
      ccipBnM,
      deployerWallet,
    };
  }

  it('should transfer Hello World and 100 CCIP_BnM tokens', async function () {
    const {
      CCIPSender_Unsafe,
      CCIPReceiver_Unsafe,
      config,
      // ccipBnM,
      deployerWallet,
    } = await loadFixture(deploy);

    const ONE_ETHER = 1_000_000_000_000_000_000n;

    const textToSend = `Hello World`;
    const amountToSend = 100n;

    const tx = await deployerWallet.sendTransaction({
      to: CCIPSender_Unsafe.getAddress(),
      value: ONE_ETHER,
    });
    await tx.wait();

    await CCIPSender_Unsafe.connect(deployerWallet).sendMessage(
      config.chainSelector_,
      CCIPReceiver_Unsafe.getAddress(),
      textToSend,
    );

    const received = await CCIPReceiver_Unsafe.getLastReceivedMessageDetails();
    // console.log('CCIP reciever got : ', received);
    expect(received[1]).to.equal(textToSend);
  });
});
