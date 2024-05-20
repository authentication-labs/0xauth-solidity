import { ethers } from "hardhat";
import fs from 'fs';
import { IdFactory } from "../typechain-types";

async function main() {
    const { deployerWallet, aliceWallet, bobWallet } = await ethers.getNamedSigners();

    const IdFactoryAbi = JSON.parse(fs.readFileSync('deployments/mumbai/IdFactory.json', 'utf8'));
    const idFactoryAddress = IdFactoryAbi.address;

    const idFactory = await ethers.getContractAt(IdFactoryAbi.abi, idFactoryAddress, deployerWallet) as IdFactory;

    console.log("Identity Factory:", await idFactory.getAddress());

    const aliceIdentityTx = await idFactory.connect(aliceWallet).linkWallet(bobWallet.address);
    await aliceIdentityTx.wait();

    const aliceIdentity = await idFactory.getIdentity(aliceWallet.address);

    console.log("Alice Identity:", aliceIdentity);

    console.log("Linked Wallets:", await idFactory.getWallets(aliceIdentity));
}

main().then(() => process.exit(0));
