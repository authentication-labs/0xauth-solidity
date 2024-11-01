"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
async function main() {
    const { claimIssuerWallet, aliceWallet } = await hardhat_1.ethers.getNamedSigners();
    console.log("ClaimIssuer Wallet:", claimIssuerWallet.address);
    const claimIssuerJSON = JSON.parse(fs_1.default.readFileSync('deployments/mumbai/ClaimIssuer.json', 'utf8'));
    const claimIssuer = await hardhat_1.ethers.getContractAt(claimIssuerJSON.abi, claimIssuerJSON.address);
    console.log("ClaimIssuer Address:", await claimIssuer.getAddress());
    const IdFactoryJSON = JSON.parse(fs_1.default.readFileSync('deployments/mumbai/IdFactory.json', 'utf8'));
    const idFactory = await hardhat_1.ethers.getContractAt(IdFactoryJSON.abi, IdFactoryJSON.address);
    console.log("Identity Factory:", await idFactory.getAddress());
    const aliceIdentityAddress = await idFactory.getIdentity(aliceWallet.address);
    const aliceClaim666 = {
        id: '',
        identity: aliceIdentityAddress,
        issuer: await claimIssuer.getAddress(),
        topic: 666,
        scheme: 1,
        data: '0x0042',
        signature: '',
        uri: 'https://example.com',
    };
    aliceClaim666.id = hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [aliceClaim666.issuer, aliceClaim666.topic]));
    aliceClaim666.signature = await claimIssuerWallet.signMessage(hardhat_1.ethers.getBytes(hardhat_1.ethers.keccak256(hardhat_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]))));
    let result = await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data);
    console.log("Is Claim Valid:", result);
    const tx = await claimIssuer
        .connect(claimIssuerWallet)
        .revokeClaim(aliceClaim666.id, aliceClaim666.identity);
    await tx.wait();
    result = await claimIssuer.isClaimRevoked(aliceClaim666.signature);
    console.log("Is Claim Revoked:", result);
}
main().then(() => process.exit(0));
// Identity Factory: 0x44C311e0C5EF6412Cbb02540bF8AeD01Afb9206c
// Alice Identity: 0x83F8e89520AdcB57885ED801118689538CeE4C45
// Linked Wallets: Result(2) [
//   '0x993da5c60e862DacB5b1FD75Dc914cAA7F6cF734',
//   '0x533A29EBC83c130417580F9293639eB51105eB71'
// ]
