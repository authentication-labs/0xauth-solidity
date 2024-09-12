"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
async function main() {
    const { deployerWallet, aliceWallet } = await hardhat_1.ethers.getNamedSigners();
    const IdFactoryAbi = JSON.parse(fs_1.default.readFileSync('deployments/amoy/IdFactory.json', 'utf8'));
    const idFactoryAddress = IdFactoryAbi.address;
    const idFactory = await hardhat_1.ethers.getContractAt(IdFactoryAbi.abi, idFactoryAddress, deployerWallet);
    console.log(await idFactory.getAddress());
    const aliceIdentityTx = await idFactory.createIdentity(aliceWallet.address, 'alice.0xauth.1');
    await aliceIdentityTx.wait();
    console.log(aliceIdentityTx?.hash);
    console.log(await idFactory.getIdentity(aliceWallet.address));
}
main().then(() => process.exit(0));
