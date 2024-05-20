import { ethers } from "hardhat";
import fs from 'fs';
import { IdFactory, ClaimIssuer, Identity } from "../typechain-types";

async function main() {
    // const { deployerWallet, claimIssuerWallet, aliceWallet } = await ethers.getNamedSigners();

    // const claimIssuerJSON = JSON.parse(fs.readFileSync('deployments/amoy/ClaimIssuer.json', 'utf8'));
    // const claimIssuer = await ethers.getContractAt(claimIssuerJSON.abi, claimIssuerJSON.address) as unknown as ClaimIssuer;
    // console.log("ClaimIssuer Wallet:", await claimIssuerWallet.getAddress());
    // console.log("Deployer Wallet:", await deployerWallet.getAddress());
    // console.log("ClaimIssuer Address:", await claimIssuer.getAddress());

    const keyData = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            ["0x5EB124675c38ff71d81760F5F9A3D75BF7509FE0"]
        )
    )
    console.log("Key Data:", keyData);
    // const tx = await claimIssuer.connect(deployerWallet).addKey(
    //     keyData,
    //     3, // CLAIM
    //     1 // EDSA
    // );

    // console.log("Transaction Hash:", tx.hash);


}

main().then(() => process.exit(0));


// Identity Factory: 0x44C311e0C5EF6412Cbb02540bF8AeD01Afb9206c
// Alice Identity: 0x83F8e89520AdcB57885ED801118689538CeE4C45
// Linked Wallets: Result(2) [
//   '0x993da5c60e862DacB5b1FD75Dc914cAA7F6cF734',
//   '0x533A29EBC83c130417580F9293639eB51105eB71'
// ]