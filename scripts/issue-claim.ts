import { ethers } from "hardhat";
import fs from 'fs';
import { IdFactory, ClaimIssuer, Identity } from "../typechain-types";

async function main() {
    const { claimIssuerWallet, aliceWallet } = await ethers.getNamedSigners();

    const claimIssuerJSON = JSON.parse(fs.readFileSync('deployments/amoy/ClaimIssuer.json', 'utf8'));
    const claimIssuer = await ethers.getContractAt(claimIssuerJSON.abi, claimIssuerJSON.address) as unknown as ClaimIssuer;
    console.log("ClaimIssuer Address:", await claimIssuer.getAddress());

    const IdFactoryJSON = JSON.parse(fs.readFileSync('deployments/amoy/IdFactory.json', 'utf8'));
    const idFactory = await ethers.getContractAt(IdFactoryJSON.abi, IdFactoryJSON.address) as IdFactory;
    console.log("Identity Factory:", await idFactory.getAddress());

    const aliceIdentityAddress = await idFactory.getIdentity(aliceWallet.address);
    const identityJSON = JSON.parse(fs.readFileSync('deployments/amoy/Identity.json', 'utf8'));
    const aliceIdentity = await ethers.getContractAt(identityJSON.abi, aliceIdentityAddress) as unknown as Identity;
    console.log("Alice Identity Address:", await aliceIdentity.getAddress());

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

    aliceClaim666.id = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [aliceClaim666.issuer, aliceClaim666.topic])
    );

    aliceClaim666.signature = await claimIssuerWallet.signMessage(
        ethers.getBytes(
            ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'uint256', 'bytes'],
                    [aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.data]
                )
            )
        )
    );

    await aliceIdentity
        .connect(aliceWallet)
        .addClaim(
            aliceClaim666.topic,
            aliceClaim666.scheme,
            aliceClaim666.issuer,
            aliceClaim666.signature,
            aliceClaim666.data,
            aliceClaim666.uri
        );

    let result = await claimIssuer.isClaimValid(aliceClaim666.identity, aliceClaim666.topic, aliceClaim666.signature, aliceClaim666.data);
    console.log("Is Claim Valid:", result);
}

main().then(() => process.exit(0));


// Identity Factory: 0x44C311e0C5EF6412Cbb02540bF8AeD01Afb9206c
// Alice Identity: 0x83F8e89520AdcB57885ED801118689538CeE4C45
// Linked Wallets: Result(2) [
//   '0x993da5c60e862DacB5b1FD75Dc914cAA7F6cF734',
//   '0x533A29EBC83c130417580F9293639eB51105eB71'
// ]