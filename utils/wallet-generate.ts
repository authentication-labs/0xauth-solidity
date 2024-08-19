import { ethers } from 'ethers';

// Generate a new Ethereum wallet with a random mnemonic
const wallet = ethers.Wallet.createRandom();

// Get the mnemonic, address, public key, and private key
const mnemonic = wallet.mnemonic?.phrase;
const address = wallet.address;
const publicKey = ethers.SigningKey.computePublicKey(wallet.publicKey);
const privateKey = wallet.privateKey;

// Log the mnemonic and keys
console.log(`Mnemonic: ${mnemonic}`);
console.log(`Address: ${address}`);
console.log(`Public Key: ${publicKey}`);
console.log(`Private Key: ${privateKey}`);
