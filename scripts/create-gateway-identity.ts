import { ethers } from "hardhat";
import fs from 'fs';
import { Gateway, IdFactory } from "../typechain-types";
import BigNumber from "bignumber.js";

async function main() {
    const { deployerWallet, aliceWallet } = await ethers.getNamedSigners();

    const IdFactoryAbi = JSON.parse(fs.readFileSync('deployments/c2/IdFactory.json', 'utf8'));
    const idFactoryAddress = IdFactoryAbi.address;

    const GatewayAbi = JSON.parse(fs.readFileSync('deployments/c2/Gateway.json', 'utf8'));
    const GatewayAddress = GatewayAbi.address;

    const idFactory = await ethers.getContractAt(IdFactoryAbi.abi, idFactoryAddress, deployerWallet) as unknown as IdFactory;
    const gateway = await ethers.getContractAt(GatewayAbi.abi, GatewayAddress, deployerWallet) as unknown as Gateway;

    console.log("Factory:", await idFactory.getAddress());
    console.log("Gateway:", await gateway.getAddress());

    // 1. Transfer Ownership to Gateway
    const gatewayTx = await idFactory.transferOwnership(GatewayAddress);
    await gatewayTx.wait();

    // Get Owner
    console.log("Owner:", await idFactory.owner());

    // 2. Create Digest
    // const signatureExpiry = (BigInt(new Date().getTime()) / BigInt(1000)) + BigInt(365 * 24 * 60 * 60);
    const signatureExpiry = BigInt(1752134334);
    console.log('signatureExpiry:', signatureExpiry.toString());

    const digest =
        ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['string', 'address', 'string', 'bytes32[]', 'uint256'],
                [
                    'Authorize ONCHAINID deployment',
                    aliceWallet.address, // Management Key Address
                    'alice.1',
                    [ // Management Keys Array
                        ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet.address])),
                    ],
                    signatureExpiry
                ],
            ),
        );
    // const signature = await deployerWallet.signMessage(
    //     ethers.getBytes(
    //         digest,
    //     ),
    // )

    const signature = "0x5a43ccf3eea5137e8d2a7aa6f575fb3afc80806e3526e69ad6e7f72e632622b46a28aa0db4260cc6c19b9b3a65aba1be004d08e7013fa4df861fb342c2c496ca1b"

    console.log("Signature:", signature);
    console.log("Expirey:", signatureExpiry)

    const aliceIdentityTx = await gateway.deployIdentityWithSaltAndManagementKeys(
        aliceWallet.address,
        'alice.1',
        [ // Management Keys Array
            ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'], [deployerWallet.address])),
        ],
        signatureExpiry,
        signature
    )
    await aliceIdentityTx.wait();
    console.log(aliceIdentityTx?.hash)

    console.log(await idFactory.getIdentity(aliceWallet.address));
}

main().then(() => process.exit(0));
