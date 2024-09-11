"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
async function main() {
    const { deployerWallet, aliceWallet, bobWallet } = await hardhat_1.ethers.getNamedSigners();
    const IdFactoryAbi = JSON.parse(fs_1.default.readFileSync('deployments/mumbai/IdFactory.json', 'utf8'));
    const idFactoryAddress = IdFactoryAbi.address;
    const idFactory = await hardhat_1.ethers.getContractAt(IdFactoryAbi.abi, idFactoryAddress, deployerWallet);
    console.log("Identity Factory:", await idFactory.getAddress());
    const aliceIdentityTx = await idFactory.connect(aliceWallet).linkWallet(bobWallet.address);
    await aliceIdentityTx.wait();
    const aliceIdentity = await idFactory.getIdentity(aliceWallet.address);
    console.log("Alice Identity:", aliceIdentity);
    console.log("Linked Wallets:", await idFactory.getWallets(aliceIdentity));
}
main().then(() => process.exit(0));
