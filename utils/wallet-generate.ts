import { ethers } from 'v5ethers';

export async function generateWallet() {
  const wallet = ethers.Wallet.createRandom();

  const mnemonic = wallet.mnemonic.phrase;
  const address = wallet.address;
  const publicKey = ethers.utils.computePublicKey(wallet.publicKey);
  const privateKey = wallet.privateKey;

  return wallet;
}
