import { ethers } from "hardhat";
import fs from 'fs';
import { IdFactory } from "../typechain-types";

async function main() {
    const { deployerWallet, aliceWallet } = await ethers.getNamedSigners();

    const IdFactoryAbi = JSON.parse(fs.readFileSync('deployments/amoy/IdFactory.json', 'utf8'));
    const idFactoryAddress = IdFactoryAbi.address;

    const idFactory = await ethers.getContractAt(IdFactoryAbi.abi, idFactoryAddress, deployerWallet) as unknown as IdFactory;

    console.log(await idFactory.getAddress());

    const aliceIdentityTx = await idFactory.createIdentity(aliceWallet.address, 'alice.0xauth.1');
    await aliceIdentityTx.wait();
    console.log(aliceIdentityTx?.hash)

    console.log(await idFactory.getIdentity(aliceWallet.address));
}

main().then(() => process.exit(0));
